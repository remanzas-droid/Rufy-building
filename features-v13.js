(() => {
'use strict';

// Rufy Building v1.3.1
// Hotfix: evita il loop del MutationObserver della v1.3 e inizializza sempre
// l'allenamento A/B/C quando si entra direttamente dalla scheda Allenamento.

const DB_NAME = 'rufyBuildingDB';
const DB_VERSION = 1;
const currentModes = new Map();
let backupRequest = null;
let backupRequestTimer = null;
let historyDecorating = false;
let editDraft = null;
let editLibrary = [];
let editSessionId = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const norm = s => String(s ?? '').trim().toLowerCase();
const clone = v => JSON.parse(JSON.stringify(v));
const weightMode = v => v === 'perDumbbell' ? 'perDumbbell' : 'total';
const numberOrNull = v => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

function showToast(message, ms = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.classList.add('hidden'), ms);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withDB(fn) {
  const db = await openDB();
  try { return await fn(db); }
  finally { db.close(); }
}

function getAllSessionsFromDB(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('sessions')) { resolve([]); return; }
    const req = db.transaction('sessions').objectStore('sessions').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || '')) || (b.createdAt || 0) - (a.createdAt || 0)
    ));
    req.onerror = () => reject(req.error);
  });
}

function getKVFromDB(db, key) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('kv')) { resolve(undefined); return; }
    const req = db.transaction('kv').objectStore('kv').get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

function putSessionToDB(session) {
  return withDB(db => new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite');
    tx.objectStore('sessions').put(session);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  }));
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function backupStamp() {
  return new Date().toISOString().replace('T', '_').replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
}

async function createAutoBackup(reason) {
  const data = await withDB(async db => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    backupReason: reason,
    program: await getKVFromDB(db, 'program'),
    library: await getKVFromDB(db, 'library'),
    settings: await getKVFromDB(db, 'settings'),
    sessions: await getAllSessionsFromDB(db)
  }));
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}),
    `rufy-building-auto-backup-${reason}-${backupStamp()}.json`
  );
}

function armBackupForNextSessionPut(reason) {
  clearTimeout(backupRequestTimer);
  backupRequest = {reason, modes: new Map(currentModes)};
  backupRequestTimer = setTimeout(() => { backupRequest = null; }, 4000);
}

// Mantiene il salvataggio originale dell'app e aggiunge la modalità peso + backup.
const nativePut = IDBObjectStore.prototype.put;
IDBObjectStore.prototype.put = function(value, ...args) {
  const pending = this.name === 'sessions' && backupRequest ? backupRequest : null;
  if (pending && value && Array.isArray(value.exercises)) {
    value.exercises.forEach((ex, i) => {
      ex.weightMode = weightMode(pending.modes.get(i) || ex.weightMode);
    });
    backupRequest = null;
    clearTimeout(backupRequestTimer);
  }

  const req = nativePut.call(this, value, ...args);
  if (pending) {
    req.addEventListener('success', () => {
      setTimeout(async () => {
        try {
          await createAutoBackup(pending.reason);
          showToast('Seduta salvata · backup creato');
        } catch (err) {
          console.error('Backup automatico non riuscito', err);
          showToast('Seduta salvata · backup non scaricato');
        }
      }, 350);
    }, {once: true});
  }
  return req;
};

async function findLastModeByExerciseName(name) {
  if (!name) return 'total';
  try {
    const sessions = await withDB(getAllSessionsFromDB);
    const key = norm(name);
    for (const session of sessions) {
      const ex = session.exercises?.find(x => norm(x.actualName || x.name) === key);
      if (ex) return weightMode(ex.weightMode);
    }
  } catch (err) {
    console.error(err);
  }
  return 'total';
}

function updateWeightButton(btn, card, mode) {
  const per = mode === 'perDumbbell';
  const label = per ? 'Peso: per manubrio' : 'Peso: totale';

  // IMPORTANTE: nella v1.3 textContent veniva riscritto a ogni passaggio.
  // Poiché il MutationObserver osserva childList, questo generava un loop infinito.
  if (btn.textContent !== label) btn.textContent = label;
  btn.classList.toggle('v13-per-dumbbell', per);

  const placeholder = per ? 'kg/man.' : 'kg';
  card.querySelectorAll('input.kg').forEach(inp => {
    if (inp.placeholder !== placeholder) inp.placeholder = placeholder;
  });
}

function decorateWorkout() {
  document.querySelectorAll('#exerciseList .exercise-card').forEach(card => {
    const controls = card.querySelector('.exercise-controls');
    const idxEl = card.querySelector('[data-idx]');
    if (!controls || !idxEl) return;
    const idx = Number(idxEl.dataset.idx);
    if (!Number.isInteger(idx)) return;

    let btn = controls.querySelector('.v13-weight-mode-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini v13-weight-mode-btn';
      btn.dataset.idx = String(idx);
      controls.appendChild(btn);
      btn.addEventListener('click', () => {
        const next = currentModes.get(idx) === 'perDumbbell' ? 'total' : 'perDumbbell';
        currentModes.set(idx, next);
        updateWeightButton(btn, card, next);
      });
    }

    const existing = currentModes.get(idx);
    if (existing) {
      updateWeightButton(btn, card, existing);
      return;
    }

    const name = card.querySelector('.exercise-title')?.textContent?.trim() || '';
    currentModes.set(idx, 'total');
    updateWeightButton(btn, card, 'total');
    findLastModeByExerciseName(name).then(mode => {
      if (currentModes.get(idx) === 'total' && mode === 'perDumbbell') {
        currentModes.set(idx, mode);
        if (document.body.contains(card)) updateWeightButton(btn, card, mode);
      }
    });
  });
}

function formatSets(sets, mode) {
  if (!Array.isArray(sets) || !sets.length) return 'Nessuna serie registrata';
  return sets.map(s => {
    const parts = [];
    if (s.kg !== null && s.kg !== undefined) {
      parts.push(mode === 'perDumbbell' ? `${s.kg}-${s.kg} kg` : `${s.kg} kg`);
    }
    if (s.reps !== null && s.reps !== undefined) parts.push(`${s.reps} reps`);
    if (String(s.rir ?? '') !== '') parts.push(`RIR ${s.rir}`);
    return parts.join(' · ');
  }).join(' / ');
}

async function decorateHistory() {
  if (historyDecorating) return;
  historyDecorating = true;
  try {
    const root = document.getElementById('historyList');
    if (!root) return;
    const sessions = await withDB(getAllSessionsFromDB);
    const byId = new Map(sessions.map(s => [s.id, s]));
    const filter = document.getElementById('historyExerciseFilter')?.value || '';

    root.querySelectorAll('.history-card').forEach(card => {
      if (card.dataset.v13Decorated === '1') return;
      const del = card.querySelector('.delete-session-btn');
      const session = del ? byId.get(del.dataset.sessionId) : null;
      if (!session) return;
      card.dataset.v13Decorated = '1';

      const actions = card.querySelector('.history-actions');
      if (actions && !actions.querySelector('.v13-edit-session-btn')) {
        actions.classList.add('action-row');
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'secondary v13-edit-session-btn';
        edit.textContent = 'Modifica allenamento';
        edit.addEventListener('click', () => openEditModal(session.id));
        actions.insertBefore(edit, actions.firstChild);
      }

      const exs = filter
        ? (session.exercises || []).filter(e => (e.actualId || e.id) === filter)
        : (session.exercises || []);
      const rows = card.querySelectorAll('.history-ex');
      rows.forEach((row, i) => {
        const ex = exs[i];
        if (!ex) return;
        const mode = weightMode(ex.weightMode);
        const muted = row.querySelector('.muted');
        const formatted = formatSets(ex.sets, mode);
        if (muted && muted.textContent !== formatted) muted.textContent = formatted;
        if (mode === 'perDumbbell' && !row.querySelector('.v13-weight-pill')) {
          const pill = document.createElement('span');
          pill.className = 'pill v13-weight-pill';
          pill.textContent = 'per manubrio';
          row.querySelector('strong')?.insertAdjacentElement('afterend', pill);
        }
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    historyDecorating = false;
  }
}

function libraryOptionHtml(selectedId, currentName) {
  const opts = editLibrary.map(x =>
    `<option value="${esc(x.id)}" ${x.id === selectedId ? 'selected' : ''}>${esc(x.name)}</option>`
  ).join('');
  if (selectedId && !editLibrary.some(x => x.id === selectedId)) {
    return `<option value="${esc(selectedId)}" selected>${esc(currentName || 'Esercizio')}</option>${opts}`;
  }
  return opts;
}

function renderEditModal() {
  const overlay = document.getElementById('v13EditOverlay');
  if (!overlay || !editDraft) return;
  const body = overlay.querySelector('.v13-edit-body');
  body.innerHTML = `
    <div class="v13-edit-meta">
      <strong>${esc(editDraft.workout ? 'Full Body ' + editDraft.workout : 'Seduta')}</strong>
      <span>${esc(editDraft.date || '')}</span>
    </div>
    ${(editDraft.exercises || []).map((ex, ei) => `
      <article class="v13-edit-ex" data-ei="${ei}">
        <div class="v13-edit-row2">
          <label>Esercizio
            <select class="v13-ex-select" data-ei="${ei}">${libraryOptionHtml(ex.actualId || ex.id, ex.actualName || ex.name)}</select>
          </label>
          <label>Stato
            <select class="v13-status" data-ei="${ei}">
              ${['normale','ridotto','saltato','sostituito'].map(v => `<option value="${v}" ${v === (ex.status || 'normale') ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="v13-edit-row2">
          <label>Peso
            <select class="v13-weight-mode" data-ei="${ei}">
              <option value="total" ${weightMode(ex.weightMode) === 'total' ? 'selected' : ''}>Peso totale</option>
              <option value="perDumbbell" ${weightMode(ex.weightMode) === 'perDumbbell' ? 'selected' : ''}>Per singolo manubrio</option>
            </select>
          </label>
          <button type="button" class="ghost v13-remove-ex" data-ei="${ei}">Rimuovi esercizio</button>
        </div>
        <div class="v13-edit-sets">
          ${(Array.isArray(ex.sets) && ex.sets.length ? ex.sets : [{kg:null,reps:null,rir:''}]).map((s, si) => `
            <div class="v13-edit-set" data-ei="${ei}" data-si="${si}">
              <span>${si + 1}</span>
              <input class="v13-kg" data-ei="${ei}" data-si="${si}" type="number" min="0" step="0.5" inputmode="decimal" value="${esc(s.kg ?? '')}" placeholder="${weightMode(ex.weightMode) === 'perDumbbell' ? 'kg/man.' : 'kg'}">
              <input class="v13-reps" data-ei="${ei}" data-si="${si}" type="number" min="0" step="1" inputmode="numeric" value="${esc(s.reps ?? '')}" placeholder="reps">
              <select class="v13-rir" data-ei="${ei}" data-si="${si}">
                <option value="" ${String(s.rir ?? '') === '' ? 'selected' : ''}>RIR</option>
                ${['0','1','2','3','4','5+'].map(v => `<option value="${v}" ${String(s.rir ?? '') === v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
              <button type="button" class="v13-remove-set" data-ei="${ei}" data-si="${si}">×</button>
            </div>`).join('')}
        </div>
        <button type="button" class="mini v13-add-set" data-ei="${ei}">+ serie</button>
      </article>`).join('')}
    <article class="v13-edit-add">
      <label>Aggiungi esercizio
        <select id="v13AddExerciseSelect">${editLibrary.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select>
      </label>
      <button id="v13AddExerciseBtn" type="button" class="secondary">Aggiungi</button>
    </article>
    <label>Note seduta
      <textarea id="v13EditNote" rows="4" placeholder="Note della seduta">${esc(editDraft.note || '')}</textarea>
    </label>`;
  bindEditModalBody();
}

function ensureSets(ex) {
  if (!Array.isArray(ex.sets) || !ex.sets.length) ex.sets = [{kg:null,reps:null,rir:''}];
  return ex.sets;
}

function bindEditModalBody() {
  const overlay = document.getElementById('v13EditOverlay');
  if (!overlay || !editDraft) return;

  overlay.querySelector('#v13EditNote')?.addEventListener('input', e => { editDraft.note = e.target.value; });

  overlay.querySelectorAll('.v13-ex-select').forEach(sel => sel.addEventListener('change', () => {
    const ex = editDraft.exercises[+sel.dataset.ei];
    const lib = editLibrary.find(x => x.id === sel.value);
    if (!ex || !lib) return;
    ex.id = lib.id;
    ex.actualId = lib.id;
    ex.name = lib.name;
    ex.actualName = lib.name;
    ex.muscle = lib.muscle || ex.muscle || 'Altro';
  }));

  overlay.querySelectorAll('.v13-status').forEach(sel => sel.addEventListener('change', () => {
    const ex = editDraft.exercises[+sel.dataset.ei];
    if (ex) ex.status = sel.value;
  }));

  overlay.querySelectorAll('.v13-weight-mode').forEach(sel => sel.addEventListener('change', () => {
    const ex = editDraft.exercises[+sel.dataset.ei];
    if (ex) { ex.weightMode = weightMode(sel.value); renderEditModal(); }
  }));

  overlay.querySelectorAll('.v13-kg').forEach(inp => inp.addEventListener('input', () => {
    const ex = editDraft.exercises[+inp.dataset.ei];
    if (ex) ensureSets(ex)[+inp.dataset.si].kg = inp.value;
  }));
  overlay.querySelectorAll('.v13-reps').forEach(inp => inp.addEventListener('input', () => {
    const ex = editDraft.exercises[+inp.dataset.ei];
    if (ex) ensureSets(ex)[+inp.dataset.si].reps = inp.value;
  }));
  overlay.querySelectorAll('.v13-rir').forEach(sel => sel.addEventListener('change', () => {
    const ex = editDraft.exercises[+sel.dataset.ei];
    if (ex) ensureSets(ex)[+sel.dataset.si].rir = sel.value;
  }));

  overlay.querySelectorAll('.v13-add-set').forEach(btn => btn.addEventListener('click', () => {
    const ex = editDraft.exercises[+btn.dataset.ei];
    if (ex) { ensureSets(ex).push({kg:null,reps:null,rir:''}); renderEditModal(); }
  }));
  overlay.querySelectorAll('.v13-remove-set').forEach(btn => btn.addEventListener('click', () => {
    const ex = editDraft.exercises[+btn.dataset.ei];
    if (!ex) return;
    const sets = ensureSets(ex);
    if (sets.length > 1) { sets.splice(+btn.dataset.si, 1); renderEditModal(); }
  }));
  overlay.querySelectorAll('.v13-remove-ex').forEach(btn => btn.addEventListener('click', () => {
    if (editDraft.exercises.length <= 1) { showToast('Lascia almeno un esercizio'); return; }
    editDraft.exercises.splice(+btn.dataset.ei, 1);
    renderEditModal();
  }));

  overlay.querySelector('#v13AddExerciseBtn')?.addEventListener('click', () => {
    const id = overlay.querySelector('#v13AddExerciseSelect')?.value;
    const lib = editLibrary.find(x => x.id === id);
    if (!lib) return;
    editDraft.exercises.push({
      id: lib.id,
      actualId: lib.id,
      name: lib.name,
      actualName: lib.name,
      muscle: lib.muscle || 'Altro',
      status: 'normale',
      weightMode: 'total',
      sets: [{kg:null,reps:null,rir:''}]
    });
    renderEditModal();
  });
}

async function openEditModal(sessionId) {
  try {
    const data = await withDB(async db => ({
      sessions: await getAllSessionsFromDB(db),
      library: await getKVFromDB(db, 'library')
    }));
    const session = data.sessions.find(s => s.id === sessionId);
    if (!session) { showToast('Seduta non trovata'); return; }
    editDraft = clone(session);
    editDraft.exercises = (editDraft.exercises || []).map(ex => ({
      ...ex,
      weightMode: weightMode(ex.weightMode),
      sets: (Array.isArray(ex.sets) && ex.sets.length ? ex.sets : [{kg:null,reps:null,rir:''}]).map(s => ({
        kg: s.kg ?? null,
        reps: s.reps ?? null,
        rir: String(s.rir ?? '')
      }))
    }));
    editLibrary = Array.isArray(data.library) ? data.library : [];
    editSessionId = sessionId;
    const overlay = document.getElementById('v13EditOverlay');
    overlay.classList.remove('hidden');
    renderEditModal();
  } catch (err) {
    console.error(err);
    showToast('Impossibile aprire la seduta');
  }
}

function closeEditModal() {
  document.getElementById('v13EditOverlay')?.classList.add('hidden');
  editDraft = null;
  editLibrary = [];
  editSessionId = null;
}

async function saveEditedSession() {
  if (!editDraft || !editSessionId) return;
  const note = document.getElementById('v13EditNote')?.value ?? editDraft.note ?? '';
  editDraft.note = String(note).trim();
  editDraft.updatedAt = Date.now();
  editDraft.exercises = (editDraft.exercises || []).map(ex => ({
    ...ex,
    weightMode: weightMode(ex.weightMode),
    sets: ensureSets(ex).map(s => ({
      kg: numberOrNull(s.kg),
      reps: numberOrNull(s.reps),
      rir: String(s.rir ?? '')
    })).filter(s => s.kg !== null || s.reps !== null || s.rir !== '')
  }));

  try {
    await putSessionToDB(editDraft);
    await createAutoBackup('modifica');
    closeEditModal();
    showToast('Seduta aggiornata · backup creato');
    document.getElementById('historyExerciseFilter')?.dispatchEvent(new Event('change', {bubbles: true}));
  } catch (err) {
    console.error(err);
    showToast('Salvataggio modifiche non riuscito');
  }
}

function ensureEditOverlay() {
  if (document.getElementById('v13EditOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'v13EditOverlay';
  overlay.className = 'v13-overlay hidden';
  overlay.innerHTML = `
    <div class="v13-modal">
      <div class="v13-modal-head">
        <div><div class="eyebrow">STORICO</div><h2>Modifica seduta</h2></div>
        <button id="v13CloseEdit" type="button" class="ghost">Chiudi</button>
      </div>
      <div class="v13-edit-body"></div>
      <div class="v13-modal-actions">
        <button id="v13CancelEdit" type="button" class="ghost">Annulla</button>
        <button id="v13SaveEdit" type="button" class="primary">Salva modifiche</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#v13CloseEdit').addEventListener('click', closeEditModal);
  overlay.querySelector('#v13CancelEdit').addEventListener('click', closeEditModal);
  overlay.querySelector('#v13SaveEdit').addEventListener('click', saveEditedSession);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditModal(); });
}

function injectStyles() {
  if (document.getElementById('v13Styles')) return;
  const style = document.createElement('style');
  style.id = 'v13Styles';
  style.textContent = `
    .v13-weight-mode-btn.v13-per-dumbbell{border-color:#3d7cf0;background:#172741;color:#fff}
    .v13-overlay{position:fixed;inset:0;z-index:120;background:rgba(3,6,10,.86);padding:16px;overflow:auto;display:flex;align-items:flex-start;justify-content:center}
    .v13-modal{width:min(760px,100%);background:#0d141f;border:1px solid #2b3b52;border-radius:20px;padding:16px;margin:12px auto 90px;box-shadow:0 24px 70px rgba(0,0,0,.55)}
    .v13-modal-head,.v13-modal-actions,.v13-edit-meta{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .v13-modal-actions{position:sticky;bottom:0;background:#0d141f;padding-top:12px;margin-top:14px;border-top:1px solid #223044}
    .v13-edit-meta{padding:10px 0 14px;color:#9aabc0}
    .v13-edit-ex,.v13-edit-add{background:#101722;border:1px solid #243247;border-radius:16px;padding:12px;margin-bottom:12px}
    .v13-edit-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end}
    .v13-edit-set{display:grid;grid-template-columns:30px 1fr 1fr 90px 36px;gap:7px;align-items:center;margin:8px 0}
    .v13-edit-set input,.v13-edit-set select{margin:0;min-height:40px;padding:8px}
    .v13-edit-set>span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#172338;color:#b9cff0;font-weight:800}
    .v13-remove-set{width:34px;height:34px;border-radius:9px;background:#24161a;border:1px solid #5b2f38;color:#e9adb8}
    .v13-remove-ex{align-self:end}
    @media(max-width:560px){
      .v13-overlay{padding:8px}.v13-modal{padding:12px;margin-top:4px}
      .v13-edit-row2{grid-template-columns:1fr}
      .v13-edit-set{grid-template-columns:28px 1fr 1fr;grid-template-areas:"n kg reps" "n rir rem"}
      .v13-edit-set>span{grid-area:n}.v13-kg{grid-area:kg}.v13-reps{grid-area:reps}.v13-rir{grid-area:rir}.v13-remove-set{grid-area:rem}
    }`;
  document.head.appendChild(style);
}

function exportCsvWithWeightMode() {
  withDB(getAllSessionsFromDB).then(sessions => {
    const rows = [['data','workout','esercizio','stato','serie','kg','reps','rir','muscolo','modalita_peso']];
    sessions.slice().reverse().forEach(s => (s.exercises || []).forEach(e => (e.sets || []).forEach((x, i) => rows.push([
      s.date || '', s.workout || '', e.actualName || e.name || '', e.status || '', i + 1,
      x.kg ?? '', x.reps ?? '', x.rir ?? '', e.muscle || '', weightMode(e.weightMode) === 'perDumbbell' ? 'per_manubrio' : 'totale'
    ]))));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    downloadBlob(new Blob([csv], {type:'text/csv;charset=utf-8'}), `rufy-building-${date}.csv`);
  }).catch(err => {
    console.error(err);
    showToast('Esportazione CSV non riuscita');
  });
}

function savePrecheckValues() {
  const ids = ['sleepScore','fatigueScore','domsScore','stressScore','painLevel','painNote'];
  return Object.fromEntries(ids.map(id => [id, document.getElementById(id)?.value ?? '']));
}

function restorePrecheckValues(values) {
  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

function workoutNeedsInitialization() {
  const precheck = document.getElementById('precheckPanel');
  if (!precheck || precheck.classList.contains('hidden')) return false;
  const title = document.getElementById('precheckTitle')?.textContent?.trim() || '';
  return title === 'Check rapido' || /Full Body\s+(?:null|undefined)\b/i.test(title);
}

function initializeWorkoutFromNext() {
  if (!workoutNeedsInitialization()) return false;
  const values = savePrecheckValues();
  const start = document.getElementById('startNextBtn');
  if (!start) return false;
  start.click();
  restorePrecheckValues(values);
  return true;
}

function init() {
  injectStyles();
  ensureEditOverlay();

  // Se si entra direttamente dalla tab Allenamento, seleziona il prossimo A/B/C.
  document.querySelector('.nav-btn[data-view="workout"]')?.addEventListener('click', () => {
    setTimeout(() => initializeWorkoutFromNext(), 0);
  });

  // Fallback: garantisce A/B/C anche se l'utente preme subito "Apri allenamento".
  document.getElementById('beginSessionBtn')?.addEventListener('click', () => {
    initializeWorkoutFromNext();
    currentModes.clear();
  }, true);

  document.getElementById('saveSessionBtn')?.addEventListener('click', () => armBackupForNextSessionPut('salvataggio'), true);

  document.getElementById('exportCsvBtn')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    exportCsvWithWeightMode();
  }, true);

  const exerciseList = document.getElementById('exerciseList');
  if (exerciseList) {
    let workoutQueued = false;
    const observer = new MutationObserver(() => {
      if (workoutQueued) return;
      workoutQueued = true;
      queueMicrotask(() => {
        workoutQueued = false;
        decorateWorkout();
      });
    });
    observer.observe(exerciseList, {childList:true, subtree:true});
    decorateWorkout();
  }

  const historyList = document.getElementById('historyList');
  if (historyList) {
    let historyTimer = null;
    new MutationObserver(() => {
      clearTimeout(historyTimer);
      historyTimer = setTimeout(decorateHistory, 0);
    }).observe(historyList, {childList:true, subtree:true});
    decorateHistory();
  }
}

init();
})();
