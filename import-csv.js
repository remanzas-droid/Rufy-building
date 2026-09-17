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
  showMessage.timer = setTimeout(() => el.classList.add('hidden'), 3600);
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
    .slice(0, 40) || 'exercise';
}

function numberOrNull(value) {
  const s = String(value ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function norm(value) {
  return String(value ?? '').trim().toLowerCase();
}

function parseWeightMode(value) {
  const v = norm(value).replace(/[\s-]+/g, '_');
  return ['per_manubrio','per_dumbbell','manubrio','dumbbell'].includes(v) ? 'perDumbbell' : 'total';
}

function shortHash(value) {
  let h = 2166136261;
  const s = String(value);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function sessionSignature(session) {
  const rows = [];
  (session.exercises || []).forEach(e => {
    const name = norm(e.actualName || e.name);
    const status = norm(e.status || 'normale');
    const muscle = norm(e.muscle || '');
    const weightMode = e.weightMode === 'perDumbbell' ? 'per_manubrio' : 'totale';
    (Array.isArray(e.sets) ? e.sets : []).forEach((set, i) => {
      rows.push([
        name,
        status,
        i + 1,
        set?.kg ?? '',
        set?.reps ?? '',
        norm(set?.rir ?? ''),
        muscle,
        weightMode
      ].join('|'));
    });
  });
  rows.sort();
  return [session.date || '', norm(session.workout || ''), ...rows].join('||');
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

function getAllSessions(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('sessions').objectStore('sessions').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function importRecords(db, sessions, library, settings) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['sessions', 'kv'], 'readwrite');
    const sessionStore = tx.objectStore('sessions');
    sessions.forEach(s => sessionStore.put(s));
    tx.objectStore('kv').put({ key: 'library', value: library });
    if (settings) tx.objectStore('kv').put({ key: 'settings', value: settings });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function importCSV(file) {
  const rows = parseCSV(await file.text());
  if (rows.length < 2) throw new Error('CSV vuoto o senza dati');

  const header = rows[0].map(v => norm(v));
  const required = ['data','workout','esercizio','stato','serie','kg','reps','rir','muscolo'];
  const idx = Object.fromEntries(required.map(k => [k, header.indexOf(k)]));
  if (required.some(k => idx[k] < 0)) throw new Error('Formato CSV non riconosciuto');
  const weightModeIndex = header.indexOf('modalita_peso');

  const db = await openDB();
  const existingSessions = await getAllSessions(db);
  const existingSignatures = new Set(existingSessions.map(sessionSignature));

  const storedLibrary = await getKV(db, 'library');
  const library = Array.isArray(storedLibrary) ? storedLibrary : [];
  const libraryByName = new Map(library.map(e => [norm(e.name), e]));

  const groups = new Map();
  let validRows = 0;

  for (const r of rows.slice(1)) {
    const date = String(r[idx.data] || '').trim();
    const workout = String(r[idx.workout] || '').trim();
    const name = String(r[idx.esercizio] || '').trim();
    const status = String(r[idx.stato] || '').trim() || 'normale';
    const setNo = Math.max(1, parseInt(r[idx.serie], 10) || 1);
    const muscleCsv = String(r[idx.muscolo] || '').trim();
    const weightMode = weightModeIndex >= 0 ? parseWeightMode(r[weightModeIndex]) : 'total';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) continue;

    const keyName = norm(name);
    let lib = libraryByName.get(keyName);
    if (!lib) {
      let baseId = `csv_${slug(name)}`;
      let candidate = baseId;
      let n = 2;
      while (library.some(x => x.id === candidate && norm(x.name) !== keyName)) {
        candidate = `${baseId}_${n++}`;
      }
      lib = { id: candidate, name, muscle: muscleCsv || 'Altro' };
      library.push(lib);
      libraryByName.set(keyName, lib);
    }

    const groupKey = `${date}||${workout}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
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
    const exKey = `${keyName}||${norm(status)}||${lib.id}`;
    let ex = session._exerciseMap.get(exKey);
    if (!ex) {
      ex = {
        id: lib.id,
        actualId: lib.id,
        name: lib.name,
        actualName: name,
        muscle: muscleCsv || lib.muscle || 'Altro',
        status,
        weightMode,
        sets: []
      };
      session._exerciseMap.set(exKey, ex);
      session.exercises.push(ex);
    } else if (weightMode === 'perDumbbell') {
      ex.weightMode = 'perDumbbell';
    }

    while (ex.sets.length < setNo) ex.sets.push({ kg: null, reps: null, rir: '' });
    ex.sets[setNo - 1] = {
      kg: numberOrNull(r[idx.kg]),
      reps: numberOrNull(r[idx.reps]),
      rir: String(r[idx.rir] ?? '').trim()
    };
    validRows++;
  }

  let duplicateCount = 0;
  const sessions = [];

  for (const s of groups.values()) {
    delete s._exerciseMap;
    const signature = sessionSignature(s);

    if (existingSignatures.has(signature)) {
      duplicateCount++;
      continue;
    }

    s.id = `csv_${s.date}_${slug(s.workout || 'extra')}_${shortHash(signature)}`;
    existingSignatures.add(signature);
    sessions.push(s);
  }

  if (!validRows) {
    db.close();
    throw new Error('Nessuna riga valida trovata');
  }

  if (!sessions.length) {
    db.close();
    return { sessions: 0, rows: validRows, duplicates: duplicateCount };
  }

  const settings = (await getKV(db, 'settings')) || {
    nextWorkout: 'A',
    firstSessionDate: null,
    phaseDismissed: false
  };

  const allDates = [...existingSessions, ...sessions]
    .map(s => s.date)
    .filter(Boolean)
    .sort();

  if (allDates.length) settings.firstSessionDate = allDates[0];

  if (!existingSessions.length && sessions.length) {
    const newest = [...sessions].sort((a, b) =>
      String(b.date).localeCompare(String(a.date)) || (b.createdAt || 0) - (a.createdAt || 0)
    )[0];
    const cycle = { A: 'B', B: 'C', C: 'A' };
    if (cycle[newest.workout]) settings.nextWorkout = cycle[newest.workout];
  }

  await importRecords(db, sessions, library, settings);
  db.close();

  return {
    sessions: sessions.length,
    rows: validRows,
    duplicates: duplicateCount
  };
}

input.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const result = await importCSV(file);

    if (!result.sessions && result.duplicates) {
      showMessage(`CSV controllato: ${result.duplicates} sedute già presenti, nessun duplicato creato`);
    } else {
      const dup = result.duplicates ? ` · ${result.duplicates} già presenti ignorate` : '';
      showMessage(`CSV importato: ${result.sessions} nuove sedute · ${result.rows} serie${dup}`);
    }

    setTimeout(() => location.reload(), 1400);
  } catch (err) {
    console.error(err);
    showMessage(err?.message || 'Importazione CSV non riuscita');
  } finally {
    e.target.value = '';
  }
});
})();

// Rufy Building v1.3 feature loader
(() => {
  const s = document.createElement('script');
  s.src = './features-v13.js';
  s.async = false;
  document.body.appendChild(s);
})();
