(() => {
'use strict';

const input = document.getElementById('importCsvInput');
if (!input) return;

function showMessage(message) {
  const el = document.getElementById('toast');
  if (!el) { alert(message); return; }
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => el.classList.add('hidden'), 3200);
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  const src = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => String(v).trim() !== ''));
}

function slug(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'exercise';
}

function numberOrNull(value) {
  const s = String(value ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('rufyBuildingDB', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getKV(db, key) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('kv').objectStore('kv').get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

function getSession(db, id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('sessions').objectStore('sessions').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function importRecords(db, sessions, library) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['sessions', 'kv'], 'readwrite');
    const sessionStore = tx.objectStore('sessions');
    sessions.forEach(s => sessionStore.put(s));
    tx.objectStore('kv').put({ key: 'library', value: library });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function importCSV(file) {
  const rows = parseCSV(await file.text());
  if (rows.length < 2) throw new Error('CSV vuoto o senza dati');

  const header = rows[0].map(v => String(v).trim().toLowerCase());
  const required = ['data','workout','esercizio','stato','serie','kg','reps','rir','muscolo'];
  const idx = Object.fromEntries(required.map(k => [k, header.indexOf(k)]));
  if (required.some(k => idx[k] < 0)) throw new Error('Formato CSV non riconosciuto');

  const db = await openDB();
  const storedLibrary = await getKV(db, 'library');
  const library = Array.isArray(storedLibrary) ? storedLibrary : [];
  const libraryByName = new Map(library.map(e => [String(e.name).trim().toLowerCase(), e]));
  const groups = new Map();
  let validRows = 0;

  for (const r of rows.slice(1)) {
    const date = String(r[idx.data] || '').trim();
    const workout = String(r[idx.workout] || '').trim();
    const name = String(r[idx.esercizio] || '').trim();
    const status = String(r[idx.stato] || '').trim() || 'normale';
    const setNo = Math.max(1, parseInt(r[idx.serie], 10) || 1);
    const muscleCsv = String(r[idx.muscolo] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) continue;

    const keyName = name.toLowerCase();
    let lib = libraryByName.get(keyName);
    if (!lib) {
      lib = { id: `csv_${slug(name)}`, name, muscle: muscleCsv || 'Altro' };
      library.push(lib);
      libraryByName.set(keyName, lib);
    }

    const groupKey = `${date}||${workout}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: `csv_${date}_${slug(workout || 'extra')}`,
        date,
        workout,
        createdAt: new Date(`${date}T12:00:00`).getTime(),
        recovery: {},
        note: 'Importato da CSV',
        exercises: [],
        _exerciseMap: new Map()
      });
    }

    const session = groups.get(groupKey);
    const exKey = `${keyName}||${status}||${lib.id}`;
    let ex = session._exerciseMap.get(exKey);
    if (!ex) {
      ex = {
        id: lib.id,
        actualId: lib.id,
        name: lib.name,
        actualName: name,
        muscle: muscleCsv || lib.muscle || 'Altro',
        status,
        sets: []
      };
      session._exerciseMap.set(exKey, ex);
      session.exercises.push(ex);
    }

    while (ex.sets.length < setNo) ex.sets.push({ kg: null, reps: null, rir: null });
    ex.sets[setNo - 1] = {
      kg: numberOrNull(r[idx.kg]),
      reps: numberOrNull(r[idx.reps]),
      rir: String(r[idx.rir] ?? '').trim() || null
    };
    validRows++;
  }

  const sessions = [...groups.values()].map(s => {
    delete s._exerciseMap;
    return s;
  });
  if (!validRows || !sessions.length) throw new Error('Nessuna riga valida trovata');

  let overwritten = 0;
  for (const s of sessions) if (await getSession(db, s.id)) overwritten++;
  await importRecords(db, sessions, library);
  db.close();

  return { sessions: sessions.length, rows: validRows, overwritten };
}

input.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const result = await importCSV(file);
    const extra = result.overwritten ? ` · ${result.overwritten} già presenti aggiornate` : '';
    showMessage(`CSV importato: ${result.sessions} sedute · ${result.rows} serie${extra}`);
    setTimeout(() => location.reload(), 1200);
  } catch (err) {
    console.error(err);
    showMessage(err?.message || 'Importazione CSV non riuscita');
  } finally {
    e.target.value = '';
  }
});
})();
