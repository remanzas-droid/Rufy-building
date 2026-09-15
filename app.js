
(() => {
'use strict';

const DEFAULT_PROGRAM = {
  A: [
    {id:'bench', name:'Panca piana bilanciere', muscle:'Petto', sets:3, reps:'6-10', rir:'3', rest:'2-3 min', notes:'Tecnica pulita, traiettoria controllata. Priorità al petto; non inseguire il carico nella fase di rientro.'},
    {id:'lat', name:'Lat machine', muscle:'Schiena', sets:3, reps:'8-12', rir:'3', rest:'2 min', notes:'Depressione scapolare, evita slanci.'},
    {id:'legpress', name:'Pressa 45°', muscle:'Quadricipiti', sets:2, reps:'8-12', rir:'3-4', rest:'2-3 min', notes:'Parti conservativo: la corsa ha priorità e le gambe devono recuperare.'},
    {id:'row', name:'Row machine', muscle:'Schiena', sets:2, reps:'8-12', rir:'3', rest:'2 min', notes:'Torace stabile, chiudi con i gomiti senza iperestendere la schiena.'},
    {id:'legcurl', name:'Leg curl sdraiato', muscle:'Femorali', sets:2, reps:'10-15', rir:'3', rest:'90 sec', notes:'Controlla eccentrica e non sollevare il bacino.'},
    {id:'lateral', name:'Alzate laterali', muscle:'Spalle', sets:2, reps:'12-20', rir:'2-3', rest:'60-90 sec', notes:'Movimento controllato, niente slanci.'},
    {id:'curl', name:'Curl', muscle:'Bicipiti', sets:1, reps:'10-15', rir:'2-3', rest:'60-90 sec', notes:'Volume diretto volutamente basso: bicipiti già responsivi.'},
    {id:'pushdown', name:'Pushdown fune', muscle:'Tricipiti', sets:1, reps:'10-15', rir:'2-3', rest:'60-90 sec', notes:'Volume diretto volutamente basso: tricipiti già responsivi.'}
  ],
  B: [
    {id:'incline', name:'Panca inclinata manubri 30-45°', muscle:'Petto', sets:3, reps:'8-12', rir:'3', rest:'2-3 min', notes:'Mantieni scapole stabili; non trasformarla in una shoulder press.'},
    {id:'row', name:'Row machine', muscle:'Schiena', sets:3, reps:'8-12', rir:'3', rest:'2 min', notes:'Torace stabile, chiudi con i gomiti.'},
    {id:'rdl', name:'Stacco rumeno', muscle:'Femorali', sets:2, reps:'6-10', rir:'3-4', rest:'2-3 min', notes:'Hinge pulito, fermati quando perdi posizione. Conservativo con corsa vicina.'},
    {id:'legext', name:'Leg extension', muscle:'Quadricipiti', sets:2, reps:'10-15', rir:'3', rest:'90 sec', notes:'Controlla la discesa; evita rimbalzi.'},
    {id:'shoulderpress', name:'Shoulder press manubri/macchina', muscle:'Spalle', sets:2, reps:'8-12', rir:'3', rest:'2 min', notes:'Scegli la variante più stabile e indolore.'},
    {id:'lat', name:'Lat machine', muscle:'Schiena', sets:2, reps:'10-12', rir:'3', rest:'90-120 sec', notes:'Evita trazioni per ora; qui accumuli lavoro dorsale con controllo.'},
    {id:'curl', name:'Curl', muscle:'Bicipiti', sets:1, reps:'10-15', rir:'2-3', rest:'60-90 sec', notes:'Puoi portare a 2 serie se la seduta resta entro circa un’ora.'},
    {id:'pushdown', name:'Pushdown fune', muscle:'Tricipiti', sets:1, reps:'10-15', rir:'2-3', rest:'60-90 sec', notes:'Puoi portare a 2 serie se la seduta resta entro circa un’ora.'}
  ],
  C: [
    {id:'chestpress', name:'Chest press / panca manubri', muscle:'Petto', sets:3, reps:'8-12', rir:'2-3', rest:'2 min', notes:'Scegli la variante che senti meglio sul petto e che resta indolore.'},
    {id:'lat', name:'Lat machine', muscle:'Schiena', sets:3, reps:'8-12', rir:'2-3', rest:'2 min', notes:'Movimento controllato, niente slanci.'},
    {id:'squat', name:'Squat', muscle:'Quadricipiti', sets:2, reps:'6-10', rir:'3-4', rest:'2-3 min', notes:'Serve soprattutto a recuperare il pattern. Se interferisce troppo con la corsa, sostituisci con pressa o multipower.'},
    {id:'legcurl', name:'Leg curl', muscle:'Femorali', sets:2, reps:'10-15', rir:'3', rest:'90 sec', notes:'Controlla eccentrica e ROM confortevole.'},
    {id:'row', name:'Row machine', muscle:'Schiena', sets:2, reps:'10-15', rir:'2-3', rest:'90-120 sec', notes:'Torace stabile, chiusura controllata.'},
    {id:'lateral', name:'Alzate laterali', muscle:'Spalle', sets:2, reps:'12-20', rir:'2', rest:'60-90 sec', notes:'Mantieni tensione e controllo.'},
    {id:'curl', name:'Curl', muscle:'Bicipiti', sets:1, reps:'10-15', rir:'2', rest:'60-90 sec', notes:'Serie extra solo se recupero e tempo lo consentono.'},
    {id:'pushdown', name:'Pushdown fune', muscle:'Tricipiti', sets:1, reps:'10-15', rir:'2', rest:'60-90 sec', notes:'Serie extra solo se recupero e tempo lo consentono.'}
  ]
};

const DEFAULT_LIBRARY = [
  {id:'bench',name:'Panca piana bilanciere',muscle:'Petto'},
  {id:'incline',name:'Panca inclinata manubri 30-45°',muscle:'Petto'},
  {id:'chestpress',name:'Chest press / panca manubri',muscle:'Petto'},
  {id:'lat',name:'Lat machine',muscle:'Schiena'},
  {id:'row',name:'Row machine',muscle:'Schiena'},
  {id:'legpress',name:'Pressa 45°',muscle:'Quadricipiti'},
  {id:'squat',name:'Squat',muscle:'Quadricipiti'},
  {id:'legext',name:'Leg extension',muscle:'Quadricipiti'},
  {id:'rdl',name:'Stacco rumeno',muscle:'Femorali'},
  {id:'legcurl',name:'Leg curl',muscle:'Femorali'},
  {id:'shoulderpress',name:'Shoulder press manubri/macchina',muscle:'Spalle'},
  {id:'lateral',name:'Alzate laterali',muscle:'Spalle'},
  {id:'curl',name:'Curl',muscle:'Bicipiti'},
  {id:'pushdown',name:'Pushdown fune',muscle:'Tricipiti'},
  {id:'calf',name:'Calf raise',muscle:'Polpacci'},
  {id:'abs',name:'Addominali',muscle:'Core'}
];

const state = {
  db:null, program:null, library:null, settings:null, currentWorkout:null, sessionDraft:null,
  deferredInstall:null, editMode:false
};

function uid(prefix='id'){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function fmtDate(v){ if(!v) return '—'; const [y,m,d]=v.slice(0,10).split('-'); return `${d}/${m}/${y}`; }
function daysBetween(a,b){ const aa=new Date(a+'T12:00:00'); const bb=new Date(b+'T12:00:00'); return Math.round((bb-aa)/86400000); }
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add('hidden'),2200); }

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('rufyBuildingDB',1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions',{keyPath:'id'});
      if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv',{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
function store(name,mode='readonly'){ return state.db.transaction(name,mode).objectStore(name); }
function dbGetKV(key){ return new Promise((res,rej)=>{ const r=store('kv').get(key); r.onsuccess=()=>res(r.result?.value); r.onerror=()=>rej(r.error); }); }
function dbSetKV(key,value){ return new Promise((res,rej)=>{ const r=store('kv','readwrite').put({key,value}); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); }); }
function dbAddSession(s){ return new Promise((res,rej)=>{ const r=store('sessions','readwrite').put(s); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); }); }
function dbAllSessions(){ return new Promise((res,rej)=>{ const r=store('sessions').getAll(); r.onsuccess=()=>res((r.result||[]).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt)); r.onerror=()=>rej(r.error); }); }
function dbClearAll(){ return new Promise((res,rej)=>{ const tx=state.db.transaction(['sessions','kv'],'readwrite'); tx.objectStore('sessions').clear(); tx.objectStore('kv').clear(); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }

async function initData(){
  state.program=await dbGetKV('program') || JSON.parse(JSON.stringify(DEFAULT_PROGRAM));
  state.library=await dbGetKV('library') || JSON.parse(JSON.stringify(DEFAULT_LIBRARY));
  state.settings=await dbGetKV('settings') || {nextWorkout:'A', firstSessionDate:null, phaseDismissed:false};
  await dbSetKV('program',state.program); await dbSetKV('library',state.library); await dbSetKV('settings',state.settings);
}
function phaseInfo(){
  if(!state.settings.firstSessionDate) return {week:1,text:'Settimana 1 · Multiarticolari ~4 RIR · Isolamenti ~3 RIR',complete:false};
  const elapsed=daysBetween(state.settings.firstSessionDate,todayISO());
  const week=Math.floor(Math.max(0,elapsed)/7)+1;
  if(week===1) return {week,text:'Settimana 1 · Multiarticolari ~4 RIR · Isolamenti ~3 RIR',complete:false};
  if(week===2) return {week,text:'Settimana 2 · circa 3 RIR',complete:false};
  if(week<=4) return {week,text:`Settimana ${week} · prevalentemente 2–3 RIR`,complete:false};
  return {week,text:'Fase 1 completata · consigliata rivalutazione del programma',complete:true};
}
function setView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(name==='home') renderHome();
  if(name==='history') renderHistory();
  if(name==='stats') renderStats();
  if(name==='program') renderProgram();
  window.scrollTo({top:0,behavior:'smooth'});
}
async function renderHome(){
  document.getElementById('nextWorkoutTitle').textContent=state.settings.nextWorkout;
  document.getElementById('nextWorkoutDesc').textContent=`Full Body ${state.settings.nextWorkout}`;
  const p=phaseInfo();
  const pb=document.getElementById('phaseBanner');
  pb.innerHTML=p.complete
    ? `<div class="eyebrow">FASE 1</div><h3>Rientro completato</h3><p>È consigliata una rivalutazione. Puoi comunque continuare con questa scheda finché non aggiorniamo la Fase 2.</p>`
    : `<div class="eyebrow">FASE DI RIENTRO</div><strong>${esc(p.text)}</strong>`;
  const sessions=await dbAllSessions();
  if(sessions.length){
    const s=sessions[0];
    document.getElementById('lastSession').textContent=`${s.workout || 'Extra'} · ${fmtDate(s.date)}`;
    document.getElementById('lastSessionMeta').textContent=`${s.exercises.length} esercizi registrati`;
    const r=s.recovery||{};
    const vals=[r.sleep?6-r.sleep:null,r.fatigue,r.doms,r.stress].filter(v=>Number.isFinite(v));
    if(vals.length){
      const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
      const label=avg<=2?'Buono':avg<=3.3?'Medio':'Affaticato';
      document.getElementById('recoveryState').textContent=label;
      document.getElementById('recoveryMeta').textContent=`Ultimo check: ${avg.toFixed(1)}/5 di carico percepito`;
    }else{
      document.getElementById('recoveryState').textContent='—';
      document.getElementById('recoveryMeta').textContent='Ultima seduta senza check';
    }
  }else{
    document.getElementById('lastSession').textContent='Nessuna';
    document.getElementById('lastSessionMeta').textContent='Registra la prima seduta';
    document.getElementById('recoveryState').textContent='—';
    document.getElementById('recoveryMeta').textContent='Dati non disponibili';
  }
}
function startWorkout(letter){
  state.currentWorkout=letter;
  state.sessionDraft=null;
  document.getElementById('precheckPanel').classList.remove('hidden');
  document.getElementById('sessionPanel').classList.add('hidden');
  document.getElementById('precheckTitle').textContent=`Full Body ${letter} · check rapido`;
  ['sleepScore','fatigueScore','domsScore','stressScore'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('painLevel').value='nessuno'; document.getElementById('painNote').value='';
  setView('workout');
}
async function beginSession(){
  const recovery={
    sleep:numOrNull(document.getElementById('sleepScore').value),
    fatigue:numOrNull(document.getElementById('fatigueScore').value),
    doms:numOrNull(document.getElementById('domsScore').value),
    stress:numOrNull(document.getElementById('stressScore').value),
    pain:document.getElementById('painLevel').value,
    painNote:document.getElementById('painNote').value.trim()
  };
  const exercises=JSON.parse(JSON.stringify(state.program[state.currentWorkout]||[]));
  const sessions=await dbAllSessions();
  for(const ex of exercises){
    const last=findLastExercise(sessions,ex.id);
    ex.status='normale'; ex.actualName=ex.name; ex.actualId=ex.id;
    ex.setData=Array.from({length:ex.sets},(_,i)=>({
      kg:last?.sets?.[i]?.kg ?? '', reps:last?.sets?.[i]?.reps ?? '', rir:last?.sets?.[i]?.rir ?? ''
    }));
  }
  state.sessionDraft={id:uid('sess'),date:todayISO(),createdAt:Date.now(),workout:state.currentWorkout,recovery,exercises,note:''};
  document.getElementById('precheckPanel').classList.add('hidden');
  document.getElementById('sessionPanel').classList.remove('hidden');
  document.getElementById('sessionTitle').textContent=`Full Body ${state.currentWorkout}`;
  document.getElementById('sessionGuidance').textContent=phaseInfo().text;
  renderSessionExercises();
}
function numOrNull(v){ const n=Number(v); return v===''||!Number.isFinite(n)?null:n; }
function findLastExercise(sessions,id){
  for(const s of sessions){
    const e=s.exercises?.find(x=>(x.actualId||x.id)===id || x.id===id);
    if(e && e.status!=='saltato') return e;
  }
  return null;
}
function renderSessionExercises(){
  const list=document.getElementById('exerciseList'); list.innerHTML='';
  state.sessionDraft.exercises.forEach((ex,idx)=>{
    const el=document.createElement('article'); el.className='exercise-card';
    const detailsId=`details_${idx}`;
    el.innerHTML=`
      <div class="exercise-head">
        <div><div class="exercise-title">${esc(ex.actualName||ex.name)}</div><div class="target">${ex.sets} serie · ${esc(ex.reps)} reps · RIR ${esc(ex.rir)} · recupero ${esc(ex.rest)}</div></div>
        <select class="status-select" data-idx="${idx}">
          <option value="normale" ${ex.status==='normale'?'selected':''}>Normale</option>
          <option value="ridotto" ${ex.status==='ridotto'?'selected':''}>Ridotto</option>
          <option value="saltato" ${ex.status==='saltato'?'selected':''}>Saltato</option>
          <option value="sostituito" ${ex.status==='sostituito'?'selected':''}>Sostituito</option>
        </select>
      </div>
      <div class="exercise-controls">
        <button class="mini details-btn" data-target="${detailsId}" type="button">Dettagli</button>
        <button class="mini add-set-btn" data-idx="${idx}" type="button">+ serie</button>
        ${ex.status==='sostituito'?`<select class="sub-select" data-idx="${idx}">${libraryOptions(ex.actualId)}</select>`:''}
      </div>
      <div id="${detailsId}" class="details"><strong>${esc(ex.muscle)}</strong><br>${esc(ex.notes||'')}</div>
      <div class="sets">${ex.status==='saltato'?'<p class="muted">Esercizio segnato come saltato.</p>':renderSets(ex,idx)}</div>`;
    list.appendChild(el);
  });
  bindSessionControls();
}
function libraryOptions(selected){
  return state.library.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.name)}</option>`).join('');
}
function renderSets(ex,idx){
  return ex.setData.map((s,si)=>`
    <div class="set-row">
      <div class="set-index">${si+1}</div>
      <input class="kg" data-idx="${idx}" data-si="${si}" data-field="kg" inputmode="decimal" type="number" min="0" step="0.5" value="${esc(s.kg)}" placeholder="kg">
      <input class="reps" data-idx="${idx}" data-si="${si}" data-field="reps" inputmode="numeric" type="number" min="0" step="1" value="${esc(s.reps)}" placeholder="reps">
      <div class="rir" aria-label="RIR">
        ${['0','1','2','3','4','5+'].map(v=>`<button type="button" class="${String(s.rir)===v?'active':''}" data-idx="${idx}" data-si="${si}" data-rir="${v}">${v}</button>`).join('')}
      </div>
      <button type="button" class="remove-set" data-idx="${idx}" data-si="${si}">×</button>
    </div>`).join('');
}
function bindSessionControls(){
  document.querySelectorAll('.details-btn').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.target).classList.toggle('open')));
  document.querySelectorAll('.add-set-btn').forEach(b=>b.addEventListener('click',()=>{ state.sessionDraft.exercises[+b.dataset.idx].setData.push({kg:'',reps:'',rir:''}); renderSessionExercises(); }));
  document.querySelectorAll('.remove-set').forEach(b=>b.addEventListener('click',()=>{
    const e=state.sessionDraft.exercises[+b.dataset.idx]; if(e.setData.length>1){ e.setData.splice(+b.dataset.si,1); renderSessionExercises(); }
  }));
  document.querySelectorAll('.sets input').forEach(inp=>inp.addEventListener('input',()=>{
    const s=state.sessionDraft.exercises[+inp.dataset.idx].setData[+inp.dataset.si];
    s[inp.dataset.field]=inp.value;
  }));
  document.querySelectorAll('.rir button').forEach(b=>b.addEventListener('click',()=>{
    state.sessionDraft.exercises[+b.dataset.idx].setData[+b.dataset.si].rir=b.dataset.rir; renderSessionExercises();
  }));
  document.querySelectorAll('.status-select').forEach(sel=>sel.addEventListener('change',()=>{
    const ex=state.sessionDraft.exercises[+sel.dataset.idx]; ex.status=sel.value;
    if(sel.value==='sostituito' && ex.actualId===ex.id){
      const alt=state.library.find(x=>x.id!==ex.id); if(alt){ ex.actualId=alt.id; ex.actualName=alt.name; ex.muscle=alt.muscle; }
    }
    renderSessionExercises();
  }));
  document.querySelectorAll('.sub-select').forEach(sel=>sel.addEventListener('change',()=>{
    const ex=state.sessionDraft.exercises[+sel.dataset.idx]; const alt=state.library.find(x=>x.id===sel.value);
    if(alt){ ex.actualId=alt.id; ex.actualName=alt.name; ex.muscle=alt.muscle; renderSessionExercises(); }
  }));
}
async function saveSession(){
  if(!state.sessionDraft) return;
  state.sessionDraft.note=document.getElementById('sessionNote').value.trim();
  state.sessionDraft.exercises.forEach(ex=>{
    ex.sets=ex.setData.length;
    ex.setsData=undefined;
    ex.sets=ex.setData.map(s=>({kg:toNum(s.kg),reps:toNum(s.reps),rir:s.rir})).filter(s=>s.kg!==null||s.reps!==null||s.rir!=='');
    delete ex.setData;
  });
  // Normalize property name to "sets" array for stored sessions.
  state.sessionDraft.exercises.forEach(ex=>{
    if(!Array.isArray(ex.sets)) ex.sets=[];
  });
  await dbAddSession(state.sessionDraft);
  if(!state.settings.firstSessionDate) state.settings.firstSessionDate=state.sessionDraft.date;
  const cycle={A:'B',B:'C',C:'A'}; state.settings.nextWorkout=cycle[state.currentWorkout]||state.settings.nextWorkout;
  await dbSetKV('settings',state.settings);
  state.sessionDraft=null;
  toast('Seduta salvata');
  setView('home');
}
function toNum(v){ if(v===''||v===null||v===undefined) return null; const n=Number(v); return Number.isFinite(n)?n:null; }
function cancelSession(){
  state.sessionDraft=null; document.getElementById('sessionPanel').classList.add('hidden'); document.getElementById('precheckPanel').classList.remove('hidden'); setView('home');
}
function addCustomExercise(){
  if(!state.sessionDraft) return;
  const id=document.getElementById('customExerciseSelect').value; const lib=state.library.find(x=>x.id===id); if(!lib) return;
  state.sessionDraft.exercises.push({id:uid('custom'),name:lib.name,actualName:lib.name,actualId:lib.id,muscle:lib.muscle,sets:2,reps:'8-12',rir:'2-3',rest:'90-120 sec',notes:'Esercizio aggiunto manualmente.',status:'normale',setData:[{kg:'',reps:'',rir:''},{kg:'',reps:'',rir:''}]});
  renderSessionExercises();
}
function populateLibrarySelects(){
  document.getElementById('customExerciseSelect').innerHTML=state.library.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  const opts=state.library.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  document.getElementById('historyExerciseFilter').innerHTML='<option value="">Tutti gli esercizi</option>'+opts;
  document.getElementById('progressExerciseSelect').innerHTML='<option value="">—</option>'+opts;
}
async function renderHistory(){
  const sessions=await dbAllSessions(); const filter=document.getElementById('historyExerciseFilter').value;
  const root=document.getElementById('historyList'); root.innerHTML='';
  const filtered=filter?sessions.filter(s=>s.exercises?.some(e=>(e.actualId||e.id)===filter)):sessions;
  if(!filtered.length){ root.innerHTML='<article class="card muted">Nessuna seduta registrata per questo filtro.</article>'; return; }
  filtered.forEach(s=>{
    const exs=filter?s.exercises.filter(e=>(e.actualId||e.id)===filter):s.exercises;
    const card=document.createElement('article'); card.className='card history-card';
    card.innerHTML=`<div class="session-line"><div><div class="eyebrow">${esc(s.workout?'FULL BODY '+s.workout:'SEDUTA')}</div><h3>${fmtDate(s.date)}</h3></div><div class="muted">${esc(s.recovery?.pain||'')}</div></div>`+
      exs.map(e=>`<div class="history-ex"><strong>${esc(e.actualName||e.name)}</strong> ${e.status&&e.status!=='normale'?`<span class="pill">${esc(e.status)}</span>`:''}<div class="muted">${formatSets(e.sets)}</div></div>`).join('')+
      (s.note?`<p class="muted">${esc(s.note)}</p>`:'');
    root.appendChild(card);
  });
}
function formatSets(sets){
  if(!Array.isArray(sets)||!sets.length) return 'Nessuna serie registrata';
  return sets.map(s=>{
    const a=[]; if(s.kg!==null) a.push(`${s.kg} kg`); if(s.reps!==null) a.push(`${s.reps} reps`); if(s.rir!=='') a.push(`RIR ${s.rir}`); return a.join(' · ');
  }).join(' / ');
}
async function renderStats(){
  const sessions=await dbAllSessions();
  document.getElementById('statSessions').textContent=sessions.length;
  const today=todayISO(); const week=sessions.filter(s=>daysBetween(s.date,today)>=0&&daysBetween(s.date,today)<=6);
  document.getElementById('statWeek').textContent=week.length;
  const muscle={};
  week.forEach(s=>s.exercises?.forEach(e=>{
    if(e.status==='saltato') return;
    const valid=(e.sets||[]).filter(x=>x.kg!==null||x.reps!==null||x.rir!=='').length;
    muscle[e.muscle]=(muscle[e.muscle]||0)+valid;
  }));
  const max=Math.max(1,...Object.values(muscle));
  document.getElementById('muscleVolume').innerHTML=Object.keys(muscle).length
    ? Object.entries(muscle).sort((a,b)=>b[1]-a[1]).map(([m,v])=>`<div class="muscle-row"><span>${esc(m)}</span><div class="track"><div class="fill" style="width:${Math.round(v/max*100)}%"></div></div><strong>${v}</strong></div>`).join('')
    : '<p class="muted">Nessuna serie negli ultimi 7 giorni.</p>';
  renderAdherence(sessions);
  await renderProgressSummary();
  renderDeloadSignal(sessions);
}
function renderAdherence(sessions){
  const root=document.getElementById('adherenceChart'); root.innerHTML='';
  const now=new Date(); const weeks=[];
  for(let w=7;w>=0;w--){
    const end=new Date(now); end.setDate(now.getDate()-w*7);
    const start=new Date(end); start.setDate(end.getDate()-6);
    const count=sessions.filter(s=>{const d=new Date(s.date+'T12:00:00'); return d>=start&&d<=end;}).length;
    weeks.push({label:`-${w}`,count});
  }
  const max=Math.max(3,...weeks.map(x=>x.count));
  weeks.forEach(x=>{const d=document.createElement('div');d.className='bar-wrap';d.innerHTML=`<div class="bar" style="height:${Math.max(4,x.count/max*100)}px"></div><div>${x.count}</div>`;root.appendChild(d);});
}
async function renderProgressSummary(){
  const id=document.getElementById('progressExerciseSelect').value; const root=document.getElementById('progressSummary');
  if(!id){root.textContent='Scegli un esercizio con almeno due registrazioni.';return;}
  const sessions=(await dbAllSessions()).slice().reverse(); const pts=[];
  sessions.forEach(s=>s.exercises?.forEach(e=>{
    if((e.actualId||e.id)!==id||e.status==='saltato') return;
    const best=(e.sets||[]).filter(x=>x.kg!==null&&x.reps!==null).sort((a,b)=>(b.kg*b.reps)-(a.kg*a.reps))[0];
    if(best) pts.push({date:s.date,kg:best.kg,reps:best.reps,rir:best.rir});
  }));
  if(pts.length<2){root.textContent='Servono almeno due registrazioni valide.';return;}
  const first=pts[0],last=pts[pts.length-1];
  root.innerHTML=`Prima: <strong>${first.kg} kg × ${first.reps}</strong> (${fmtDate(first.date)})<br>Ultima: <strong>${last.kg} kg × ${last.reps}</strong> (${fmtDate(last.date)})<br><span class="muted">Confronta sempre anche il RIR: ${esc(first.rir||'—')} → ${esc(last.rir||'—')}</span>`;
}
function renderDeloadSignal(sessions){
  const card=document.getElementById('deloadCard'); const reason=document.getElementById('deloadReason');
  if(sessions.length<5){card.classList.add('hidden');return;}
  const recent=sessions.slice(0,5);
  const highFatigue=recent.filter(s=>{
    const r=s.recovery||{}; const vals=[r.fatigue,r.doms,r.stress].filter(Number.isFinite);
    return vals.length && vals.reduce((a,b)=>a+b,0)/vals.length>=4;
  }).length;

  // Segnale prudente di calo: confronta le ultime 3 esposizioni valide dei principali esercizi.
  const majorIds=['bench','incline','chestpress','lat','row','legpress','squat','rdl'];
  let declining=0;
  majorIds.forEach(id=>{
    const vals=[];
    for(const s of sessions){
      const e=s.exercises?.find(x=>(x.actualId||x.id)===id && x.status!=='saltato');
      if(!e) continue;
      const valid=(e.sets||[]).filter(x=>Number.isFinite(x.kg)&&Number.isFinite(x.reps)&&x.reps>0);
      if(!valid.length) continue;
      // Stima comparativa interna, non un vero test massimale.
      const best=Math.max(...valid.map(x=>x.kg*(1+x.reps/30)));
      vals.push(best);
      if(vals.length===3) break;
    }
    if(vals.length===3 && vals[0] < vals[1]*0.97 && vals[1] < vals[2]*0.97) declining++;
  });

  if(highFatigue>=3 || declining>=2){
    const parts=[];
    if(highFatigue>=3) parts.push('fatica/DOMS/stress elevati in almeno 3 delle ultime 5 sedute');
    if(declining>=2) parts.push('calo ripetuto della performance in almeno 2 esercizi principali');
    reason.textContent=`Segnale da valutare: ${parts.join(' e ')}.`;
    card.classList.remove('hidden');
  } else card.classList.add('hidden');
}
function renderProgram(){
  const root=document.getElementById('programList'); root.innerHTML='';
  ['A','B','C'].forEach(k=>{
    const c=document.createElement('article'); c.className='card';
    c.innerHTML=`<div class="eyebrow">FULL BODY ${k}</div><h3>Allenamento ${k}</h3>`+
      state.program[k].map(e=>`<p><strong>${esc(e.name)}</strong><br><span class="muted">${e.sets}×${esc(e.reps)} · RIR ${esc(e.rir)} · ${esc(e.rest)}</span></p>`).join('');
    root.appendChild(c);
  });
  if(state.editMode) renderProgramEditor();
}
function renderProgramEditor(){
  const root=document.getElementById('programEditor'); if(!root) return;
  root.innerHTML='';
  ['A','B','C'].forEach(k=>{
    const wrap=document.createElement('div'); wrap.className='card';
    wrap.innerHTML=`<div class="eyebrow">FULL BODY ${k}</div><h3>Modifica ${k}</h3>
      <div class="editor-list">
        ${state.program[k].map((e,i)=>`
          <div class="program-edit-row" data-workout="${k}" data-index="${i}">
            <strong>${esc(e.name)}</strong>
            <div class="check-grid">
              <label>Serie<input data-field="sets" type="number" min="1" max="10" value="${esc(e.sets)}"></label>
              <label>Reps<input data-field="reps" type="text" value="${esc(e.reps)}"></label>
              <label>RIR<input data-field="rir" type="text" value="${esc(e.rir)}"></label>
              <label>Recupero<input data-field="rest" type="text" value="${esc(e.rest)}"></label>
            </div>
            <label>Note<textarea data-field="notes" rows="2">${esc(e.notes||'')}</textarea></label>
            <div class="action-row">
              <button class="secondary save-ex-edit" data-workout="${k}" data-index="${i}" type="button">Salva modifiche</button>
              <button class="ghost remove-program-ex" data-workout="${k}" data-index="${i}" type="button">Rimuovi</button>
            </div>
          </div>`).join('<hr>')}
      </div>
      <hr>
      <div class="inline-form">
        <select class="add-program-select" data-workout="${k}">${libraryOptions('')}</select>
        <button class="secondary add-program-ex" data-workout="${k}" type="button">+ esercizio</button>
      </div>`;
    root.appendChild(wrap);
  });
  root.querySelectorAll('.save-ex-edit').forEach(btn=>btn.addEventListener('click',async()=>{
    const k=btn.dataset.workout, i=+btn.dataset.index;
    const row=root.querySelector(`.program-edit-row[data-workout="${k}"][data-index="${i}"]`);
    const ex=state.program[k][i];
    row.querySelectorAll('[data-field]').forEach(inp=>{
      const f=inp.dataset.field; ex[f]=f==='sets'?Math.max(1,Math.min(10,Number(inp.value)||1)):inp.value.trim();
    });
    await dbSetKV('program',state.program); renderProgram(); toast('Programma aggiornato');
  }));
  root.querySelectorAll('.remove-program-ex').forEach(btn=>btn.addEventListener('click',async()=>{
    const k=btn.dataset.workout, i=+btn.dataset.index;
    if(state.program[k].length<=1){toast('Lascia almeno un esercizio');return;}
    state.program[k].splice(i,1); await dbSetKV('program',state.program); renderProgram(); toast('Esercizio rimosso');
  }));
  root.querySelectorAll('.add-program-ex').forEach(btn=>btn.addEventListener('click',async()=>{
    const k=btn.dataset.workout;
    const sel=root.querySelector(`.add-program-select[data-workout="${k}"]`);
    const lib=state.library.find(x=>x.id===sel.value); if(!lib) return;
    state.program[k].push({id:lib.id,name:lib.name,muscle:lib.muscle,sets:2,reps:'8-12',rir:'2-3',rest:'90-120 sec',notes:'Esercizio aggiunto manualmente al programma.'});
    await dbSetKV('program',state.program); renderProgram(); toast(`Aggiunto a ${k}`);
  }));
}
async function addLibraryExercise(){
  const name=document.getElementById('newExerciseName').value.trim(), muscle=document.getElementById('newExerciseMuscle').value.trim();
  if(!name||!muscle){toast('Inserisci nome e gruppo muscolare');return;}
  state.library.push({id:uid('ex'),name,muscle}); await dbSetKV('library',state.library); populateLibrarySelects();
  document.getElementById('newExerciseName').value=''; document.getElementById('newExerciseMuscle').value=''; toast('Esercizio aggiunto');
}
async function exportCSV(){
  const sessions=await dbAllSessions(); const rows=[['data','workout','esercizio','stato','serie','kg','reps','rir','muscolo']];
  sessions.slice().reverse().forEach(s=>s.exercises?.forEach(e=>(e.sets||[]).forEach((x,i)=>rows.push([s.date,s.workout||'',e.actualName||e.name,e.status||'',i+1,x.kg??'',x.reps??'',x.rir??'',e.muscle||'']))));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`rufy-building-${todayISO()}.csv`);
}
async function exportJSON(){
  const data={version:1,exportedAt:new Date().toISOString(),program:state.program,library:state.library,settings:state.settings,sessions:await dbAllSessions()};
  downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`rufy-building-backup-${todayISO()}.json`);
}
function downloadBlob(blob,name){ const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
async function importJSON(file){
  try{
    const data=JSON.parse(await file.text()); if(!data||data.version!==1||!Array.isArray(data.sessions)) throw new Error('Formato non valido');
    await dbClearAll(); state.program=data.program||DEFAULT_PROGRAM; state.library=data.library||DEFAULT_LIBRARY; state.settings=data.settings||{nextWorkout:'A',firstSessionDate:null};
    await dbSetKV('program',state.program);await dbSetKV('library',state.library);await dbSetKV('settings',state.settings);
    for(const s of data.sessions) await dbAddSession(s);
    populateLibrarySelects(); renderHome(); toast('Backup importato');
  }catch(e){toast('Importazione non riuscita');}
}
function registerSW(){ if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); }

function bind(){
  document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.getElementById('startNextBtn').addEventListener('click',()=>startWorkout(state.settings.nextWorkout));
  document.querySelectorAll('.workout-choice').forEach(b=>b.addEventListener('click',()=>startWorkout(b.dataset.workout)));
  document.getElementById('beginSessionBtn').addEventListener('click',beginSession);
  document.getElementById('cancelSessionBtn').addEventListener('click',cancelSession);
  document.getElementById('saveSessionBtn').addEventListener('click',saveSession);
  document.getElementById('addExerciseBtn').addEventListener('click',addCustomExercise);
  document.getElementById('historyExerciseFilter').addEventListener('change',renderHistory);
  document.getElementById('progressExerciseSelect').addEventListener('change',renderProgressSummary);
  document.getElementById('exportCsvBtn').addEventListener('click',exportCSV);
  document.getElementById('toggleEditBtn').addEventListener('click',()=>{
    state.editMode=!state.editMode; document.getElementById('editProgramPanel').classList.toggle('hidden',!state.editMode);
    document.getElementById('toggleEditBtn').textContent=state.editMode?'Chiudi modifica':'Modifica programma';
    renderProgram();
  });
  document.getElementById('addLibraryExerciseBtn').addEventListener('click',addLibraryExercise);
  document.getElementById('exportJsonBtn').addEventListener('click',exportJSON);
  document.getElementById('importJsonInput').addEventListener('change',e=>e.target.files[0]&&importJSON(e.target.files[0]));
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;document.getElementById('installBtn').classList.remove('hidden');});
  document.getElementById('installBtn').addEventListener('click',async()=>{if(state.deferredInstall){state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;document.getElementById('installBtn').classList.add('hidden');}});
}

async function init(){
  try{
    state.db=await openDB(); await initData(); populateLibrarySelects(); bind(); registerSW(); await renderHome();
  }catch(e){
    document.body.innerHTML='<main style="padding:24px;color:white;background:#090c12;font-family:system-ui"><h1>Rufy Building</h1><p>Impossibile inizializzare il database locale in questo browser.</p></main>';
  }
}
init();
})();
