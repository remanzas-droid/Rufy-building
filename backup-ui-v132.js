(() => {
'use strict';

// Rufy Building v1.3.2 — gestione dati visibile nello Storico.
// CSV = dati dello storico. JSON = backup/ripristino completo dell'app.

const DB_NAME = 'rufyBuildingDB';
const DB_VERSION = 1;

function toast(message, ms = 3200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), ms);
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

function getKV(db, key) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv').objectStore('kv').get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

function getSessions(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('sessions').objectStore('sessions').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function snapshot(reason) {
  return withDB(async db => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    backupReason: reason,
    program: await getKV(db, 'program'),
    library: await getKV(db, 'library'),
    settings: await getKV(db, 'settings'),
    sessions: await getSessions(db)
  }));
}

function stamp() {
  return new Date().toISOString()
    .replace('T', '_')
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, '');
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1200);
}

async function downloadFullBackup(reason = 'manuale') {
  const data = await snapshot(reason);
  const prefix = reason === 'pre-ripristino'
    ? 'rufy-building-backup-sicurezza-pre-ripristino'
    : 'rufy-building-backup-completo';
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}),
    `${prefix}-${stamp()}.json`
  );
  return data;
}

function validateBackup(data) {
  if (!data || typeof data !== 'object') throw new Error('File JSON non valido');
  if (data.version !== 1) throw new Error('Versione backup non supportata');
  if (!Array.isArray(data.sessions)) throw new Error('Storico sedute mancante');
  if (!data.program || typeof data.program !== 'object' || Array.isArray(data.program)) {
    throw new Error('Programma allenamento mancante');
  }
  if (!Array.isArray(data.library)) throw new Error('Libreria esercizi mancante');
  if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) {
    throw new Error('Impostazioni app mancanti');
  }
  return data;
}

async function restoreBackup(data) {
  return withDB(db => new Promise((resolve, reject) => {
    const tx = db.transaction(['sessions', 'kv'], 'readwrite');
    const sessions = tx.objectStore('sessions');
    const kv = tx.objectStore('kv');

    sessions.clear();
    kv.clear();
    data.sessions.forEach(session => sessions.put(session));
    kv.put({key: 'program', value: data.program});
    kv.put({key: 'library', value: data.library});
    kv.put({key: 'settings', value: data.settings});

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Ripristino interrotto'));
  }));
}

async function handleRestore(file, input) {
  try {
    const data = validateBackup(JSON.parse(await file.text()));

    // Prima di qualunque sostituzione crea sempre una copia dello stato attuale.
    await downloadFullBackup('pre-ripristino');

    const count = data.sessions.length;
    const exported = data.exportedAt ? new Date(data.exportedAt) : null;
    const when = exported && !Number.isNaN(exported.getTime())
      ? exported.toLocaleString('it-IT')
      : 'data non disponibile';

    const ok = window.confirm(
      `Backup di sicurezza dello stato attuale creato.\n\n` +
      `Il file selezionato contiene ${count} sedut${count === 1 ? 'a' : 'e'} ed è stato creato il ${when}.\n\n` +
      `Procedere con il ripristino completo? I dati attuali dell'app verranno sostituiti.`
    );
    if (!ok) {
      toast('Ripristino annullato · backup di sicurezza conservato');
      return;
    }

    await restoreBackup(data);
    toast('Backup ripristinato · riavvio app…');
    setTimeout(() => location.reload(), 900);
  } catch (err) {
    console.error(err);
    toast(err?.message || 'Ripristino backup non riuscito', 4200);
  } finally {
    input.value = '';
  }
}

function buildDataCard() {
  if (document.getElementById('v132DataCard')) return;
  const view = document.getElementById('view-history');
  if (!view) return;

  const heading = view.querySelector(':scope > .section-head');
  const oldActions = heading?.querySelector('.action-row');

  const card = document.createElement('article');
  card.id = 'v132DataCard';
  card.className = 'card';
  card.innerHTML = `
    <div class="eyebrow">GESTIONE DATI</div>
    <h3>Dati CSV</h3>
    <p class="muted">Per consultare, modificare o trasferire lo storico delle serie. Il CSV non è un backup completo dell'app.</p>
    <div id="v132CsvActions" class="action-row"></div>
    <hr>
    <h3>Backup completo</h3>
    <p class="muted">Salva storico, note, check pre-seduta, programma A/B/C, libreria esercizi e impostazioni.</p>
    <div class="action-row">
      <button id="v132ExportBackup" class="secondary" type="button">Esporta backup JSON</button>
      <label class="file-btn">Ripristina backup JSON
        <input id="v132ImportBackup" type="file" accept=".json,application/json">
      </label>
    </div>
    <p class="muted" style="margin-bottom:0">Prima di un ripristino Rufy Building scarica automaticamente un backup di sicurezza dei dati attuali.</p>`;

  if (heading) heading.insertAdjacentElement('afterend', card);
  else view.prepend(card);

  const csvTarget = card.querySelector('#v132CsvActions');
  if (oldActions && csvTarget) {
    while (oldActions.firstChild) csvTarget.appendChild(oldActions.firstChild);
    oldActions.remove();
  }

  card.querySelector('#v132ExportBackup')?.addEventListener('click', async () => {
    try {
      await downloadFullBackup('manuale');
      toast('Backup completo esportato');
    } catch (err) {
      console.error(err);
      toast('Esportazione backup non riuscita');
    }
  });

  const input = card.querySelector('#v132ImportBackup');
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) handleRestore(file, input);
  });
}

function init() {
  buildDataCard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, {once: true});
} else {
  init();
}
})();
