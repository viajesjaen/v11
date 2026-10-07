const cfg = window.APP_CONFIG || {};
const project = window.APP_PROJECT || {
  id:'default', name:'AR Turismo', city:'', title:'Descubre tu patrimonio', eyebrow:'AR TURISMO', description:'Explora lugares y déjate guiar hasta ellos.', logo:'',
  content:{singular:'Monumento',plural:'Monumentos',icon:'🏛️',shortDescription:'Patrimonio y lugares de interés',listTitle:'Descubre lugares',cameraHint:'Enfoca el lugar seleccionado…',historyTitle:'Conoce el lugar'},
  collaborators:{title:'Empresas colaboradoras',shortDescription:'Establecimientos y entidades asociadas'},
  routes:{title:'Rutas',shortDescription:'Recorridos guiados'}
};
const contentCfg = project.content || {};
const contentSingular = String(contentCfg.singular || 'Monumento');
const contentPlural = String(contentCfg.plural || 'Monumentos');
const contentIcon = String(contentCfg.icon || '🏛️');
const contentShort = String(contentCfg.shortDescription || 'Patrimonio y lugares de interés');
const contentListTitle = String(contentCfg.listTitle || `Descubre ${contentPlural.toLowerCase()}`);
const cameraHint = String(contentCfg.cameraHint || `Enfoca el ${contentSingular.toLowerCase()} seleccionado…`);
const historyTitle = String(contentCfg.historyTitle || `Conoce el ${contentSingular.toLowerCase()}`);

function applyProjectConfig(){
  document.documentElement.lang='es';
  const title=document.querySelector('title'); if(title) title.textContent=`${project.name || 'AR Turismo'} · ${project.title || 'Descubre'}`;
  const heroTitle=document.getElementById('projectHeroTitle'); if(heroTitle) heroTitle.textContent=project.title || 'Descubre';
  const heroEyebrow=document.getElementById('projectHeroEyebrow'); if(heroEyebrow) heroEyebrow.textContent=project.eyebrow || 'AR TURISMO';
  const heroDescription=document.getElementById('projectHeroDescription'); if(heroDescription) heroDescription.textContent=project.description || '';
  const choice=document.querySelector('[data-content-view="monuments"]');
  if(choice){ const i=choice.querySelector('span'); const st=choice.querySelector('strong'); const sm=choice.querySelector('small'); if(i)i.textContent=contentIcon; if(st)st.textContent=contentPlural; if(sm)sm.textContent=contentShort; }
  const head=document.getElementById('contentEyebrow'); if(head) head.textContent=contentPlural.toUpperCase();
  const listTitle=document.getElementById('contentListTitle'); if(listTitle) listTitle.textContent=contentListTitle;
  const cameraStatus=document.getElementById('status'); if(cameraStatus) cameraStatus.textContent=cameraHint;
  const collChoice=document.querySelector('[data-content-view="collaborators"]');
  if(collChoice){ const st=collChoice.querySelector('strong'); const sm=collChoice.querySelector('small'); if(st)st.textContent=project.collaborators?.title||'Empresas colaboradoras'; if(sm)sm.textContent=project.collaborators?.shortDescription||'Establecimientos y entidades asociadas'; }
  const routeChoice=document.querySelector('[data-content-view="routes"]');
  if(routeChoice){ const st=routeChoice.querySelector('strong'); const sm=routeChoice.querySelector('small'); if(st)st.textContent=project.routes?.title||'Rutas'; if(sm)sm.textContent=project.routes?.shortDescription||'Recorridos guiados'; }
  const backHome=document.querySelector('.back-home'); if(backHome) backHome.textContent='← Inicio';
}
applyProjectConfig();
const bootStatus = document.getElementById('bootStatus');
if (bootStatus) bootStatus.textContent = '🟢 app.js ejecutado · diagnóstico directo completado';

// Supabase se consulta por REST para la carga principal. El cliente JS se inicializa solo si está disponible para multimedia.
let sb = null;
let supabaseInitError = null;

const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const diag = document.getElementById('diagnostic');
const result = document.getElementById('result');
const placesPanel = document.getElementById('placesPanel');
const placesList = document.getElementById('placesList');
const locationStatus = document.getElementById('locationStatus');
const navigationPanel = document.getElementById('navigationPanel');
const cameraPanel = document.getElementById('cameraPanel');
const navTitle = document.getElementById('navTitle');
const navSubtitle = document.getElementById('navSubtitle');
const navDistance = document.getElementById('navDistance');
const navDistanceLarge = document.getElementById('navDistanceLarge');
const locateBtn = document.getElementById('locateBtn');
const backPlacesBtn = document.getElementById('backPlacesBtn');
const arrivedBtn = document.getElementById('arrivedBtn');
const changeDestinationBtn = document.getElementById('changeDestinationBtn');
const routesPanel = document.getElementById('routesPanel');
const routesList = document.getElementById('routesList');
const collaboratorsList = document.getElementById('collaboratorsList');
const contentChoices = [...document.querySelectorAll('[data-content-view]')];
const contentViews = {
  monuments: document.getElementById('contentViewMonuments'),
  collaborators: document.getElementById('collaboratorsPanel'),
  routes: document.getElementById('routesPanel'),
};
let collaborators = [];

// GYMKANAS: categoría independiente. Las rutas y el resto del motor no dependen de este módulo.
const GYMKANA_PROGRESS_KEY = 'ar_turismo_gymkana_jaen_leyenda_v1';
const gymkanaDemo = {
  id: 'jaen-leyenda-demo', name: 'Jaén de leyenda', icon: '🐉', mode:'both',
  description: 'Una pequeña prueba para descubrir cuánto sabes sobre las leyendas y el patrimonio de Jaén.',
  questions: [
    {q:'¿Qué criatura protagoniza una de las leyendas más conocidas de Jaén?', options:['Un dragón','Un lagarto','Un lobo','Un águila'], answer:1, points:100},
    {q:'¿Con qué lugar se relaciona tradicionalmente la leyenda del Lagarto de Jaén?', options:['El Raudal de la Magdalena','La Catedral','El Castillo de Santa Catalina','La Plaza de Santa María'], answer:0, points:100},
    {q:'¿Qué monumento conserva unos importantes baños de época andalusí?', options:['Palacio de Villardompardo','Arco de San Lorenzo','Catedral','Castillo'], answer:0, points:100},
    {q:'¿Qué gran edificio renacentista domina buena parte del perfil monumental de Jaén?', options:['La Catedral','La Muralla','Los Baños Árabes','El Arco de San Andrés'], answer:0, points:100},
    {q:'¿Qué fortaleza corona la ciudad de Jaén?', options:['Castillo de Burgalimar','Castillo de Santa Catalina','Alcázar de los Reyes','Castillo de La Guardia'], answer:1, points:100}
  ]
};
let gymkanas = [gymkanaDemo];
let activeGymkana = null;
let activeGymkanaChallenges = [];
let playerUser = null;
let playerProfile = null;
let gymkanaDbAvailable = false;

if(window.supabase?.createClient && configured()) {
  try { sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY); } catch(e) { console.warn('No se pudo inicializar Supabase Auth',e); }
}

function gymkanaLoad(){try{const x=JSON.parse(localStorage.getItem(GYMKANA_PROGRESS_KEY)||'null');return x&&typeof x==='object'?x:{q:0,score:0,done:false};}catch(_){return {q:0,score:0,done:false};}}
function gymkanaSave(x){try{localStorage.setItem(GYMKANA_PROGRESS_KEY,JSON.stringify(x));}catch(_){} }

async function refreshPlayer(){
  playerUser=null; playerProfile=null;
  if(!sb?.auth) return;
  try {
    const {data:{session}}=await sb.auth.getSession();
    playerUser=session?.user||null;
    if(playerUser){
      const {data}=await sb.from('profiles').select('id,email,full_name,role').eq('id',playerUser.id).maybeSingle();
      playerProfile=data||null;
    }
  } catch(e) { console.warn('No se pudo comprobar el usuario jugador',e); }
}

function renderPlayerAuth(){
  const el=document.getElementById('playerAuth'); if(!el)return;
  el.classList.remove('hidden');
  if(playerUser){
    const name=playerProfile?.full_name||playerUser.email||'Jugador';
    el.innerHTML=`<div class="player-auth-card"><div><strong>👤 ${esc(name)}</strong><small>Tu progreso de Gymkanas se guarda en tu cuenta.</small></div><div class="player-auth-actions"><button type="button" class="secondary" id="playerLogoutBtn">Cerrar sesión</button></div></div>`;
    el.querySelector('#playerLogoutBtn')?.addEventListener('click',async()=>{await sb.auth.signOut();await refreshPlayer();renderPlayerAuth();renderGymkanas();});
    return;
  }
  el.innerHTML=`<div class="player-auth-card"><div><strong>🎯 Juega con tu cuenta</strong><small>Inicia sesión para guardar puntos y progreso en cualquier dispositivo.</small></div><button type="button" class="primary" id="playerLoginOpen">Iniciar sesión / Crear cuenta</button></div><form class="player-auth-form hidden" id="playerAuthForm"><input id="playerName" placeholder="Nombre o apodo" autocomplete="name"><input id="playerEmail" type="email" placeholder="Email" autocomplete="email" required><input id="playerPassword" type="password" placeholder="Contraseña (mín. 6 caracteres)" autocomplete="new-password" minlength="6" required><div class="player-auth-actions"><button class="primary" type="submit">Entrar / Crear cuenta</button><button class="secondary" id="playerAuthCancel" type="button">Cancelar</button></div><p class="player-auth-msg" id="playerAuthMsg"></p></form>`;
  el.querySelector('#playerLoginOpen')?.addEventListener('click',()=>{el.querySelector('#playerAuthForm')?.classList.remove('hidden');el.querySelector('#playerLoginOpen')?.classList.add('hidden');});
  el.querySelector('#playerAuthCancel')?.addEventListener('click',()=>{el.querySelector('#playerAuthForm')?.classList.add('hidden');el.querySelector('#playerLoginOpen')?.classList.remove('hidden');});
  el.querySelector('#playerAuthForm')?.addEventListener('submit',async e=>{
    e.preventDefault(); const msg=el.querySelector('#playerAuthMsg'); msg.classList.remove('is-error'); msg.textContent='Comprobando cuenta…';
    if(!sb?.auth){msg.classList.add('is-error');msg.textContent='No se ha podido conectar con el sistema de usuarios.';return;}
    const email=el.querySelector('#playerEmail').value.trim(), password=el.querySelector('#playerPassword').value, fullName=el.querySelector('#playerName').value.trim();
    let res=await sb.auth.signInWithPassword({email,password});
    if(res.error){
      const sign=await sb.auth.signUp({email,password,options:{data:{role:'player',full_name:fullName}}});
      if(sign.error){msg.classList.add('is-error');msg.textContent='No se pudo iniciar sesión ni crear la cuenta: '+sign.error.message;return;}
      if(sign.data.session){await refreshPlayer();msg.textContent='Cuenta creada.';}
      else {msg.textContent='Cuenta creada. Revisa tu email si Supabase solicita confirmar la cuenta.';return;}
    } else { await refreshPlayer(); msg.textContent='Sesión iniciada.'; }
    renderPlayerAuth(); renderGymkanas();
  });
}

async function loadGymkanasFromDb(){
  if(!sb) return false;
  try {
    const {data,error}=await sb.from('gymkanas').select('*').eq('active',true).order('name');
    if(error) throw error;
    if(!data?.length) return true;
    const rows=[];
    for(const g of data){
      const {data:cs,error:ce}=await sb.from('gymkana_challenges').select('*').eq('gymkana_id',g.id).eq('active',true).order('sort_order');
      if(ce) throw ce;
      rows.push({...g,questions:(cs||[]).map(c=>({id:c.id,q:c.description||c.title, title:c.title, options:Array.isArray(c.options)?c.options:[], answer:Number.isInteger(c.correct_option)?c.correct_option:null, points:Number(c.points)||0, challenge_type:c.challenge_type, target_business_id:c.target_business_id, qr_token:c.qr_token, latitude:c.latitude, longitude:c.longitude, radius_meters:c.radius_meters}))});
    }
    gymkanas=rows; gymkanaDbAvailable=true; return true;
  } catch(e){ gymkanaDbAvailable=false; console.warn('Gymkanas DB no disponible todavía:',e.message); return false; }
}

async function getGymkanaProgress(g){
  if(!playerUser || !gymkanaDbAvailable || !sb) return gymkanaLoad();
  const {data}=await sb.from('gymkana_progress').select('*').eq('user_id',playerUser.id).eq('gymkana_id',g.id).maybeSingle();
  return data || {current_challenge:0,score:0,completed:false};
}

function renderGymkanas(){
  const el=document.getElementById('gymkanasList'); if(!el)return;
  const account=playerUser?`<div class="gymkana-account"><span class="score-pill">👤 ${esc(playerProfile?.full_name||playerUser.email||'Jugador')}</span></div>`:'';
  el.innerHTML=account+gymkanas.map(g=>{const local=g.id===gymkanaDemo.id?gymkanaLoad():{q:0,score:0,done:false};return `<article class="gymkana-card"><div class="gymkana-cover">${esc(g.icon||'🎯')}</div><div class="eyebrow">GYMKANA</div><h3>${esc(g.name)}</h3><p>${esc(g.description||'Completa los retos y consigue puntos.')}</p><div class="gymkana-meta"><span>❓ ${(g.questions||[]).length} pruebas</span><span>🎯 ${esc(g.mode==='both'?'Preguntas + pruebas presenciales':g.mode==='presential'?'Pruebas presenciales':'Preguntas')}</span></div><button type="button" class="gymkana-primary" data-gymkana-id="${escAttr(g.id)}">${local.q>0&&!local.done?'▶ Continuar':'🎯 Comenzar gymkana'}</button></article>`}).join('');
  el.querySelectorAll('[data-gymkana-id]').forEach(btn=>btn.addEventListener('click',()=>startGymkana(btn.dataset.gymkanaId)));
}

async function startGymkana(id){
  if(!playerUser){ renderPlayerAuth(); document.getElementById('playerAuth')?.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  const g=gymkanas.find(x=>String(x.id)===String(id))||gymkanaDemo; activeGymkanaChallenges=g.questions||[];
  const p=await getGymkanaProgress(g); const q=Number(p.current_challenge??p.q)||0; const score=Number(p.score)||0;
  activeGymkana={...g,q:Math.max(0,Math.min(q,activeGymkanaChallenges.length)),score,progressId:p.id||null};
  if(gymkanaDbAvailable && playerUser && !activeGymkana.progressId){
    const {data}=await sb.from('gymkana_progress').insert({user_id:playerUser.id,gymkana_id:g.id,current_challenge:0,score:0}).select('*').single();
    if(data) activeGymkana.progressId=data.id;
  }
  renderGymkanaQuestion();
}

function renderGymkanaQuestion(){
  const el=document.getElementById('gymkanasList'); if(!el||!activeGymkana)return;
  const total=activeGymkanaChallenges.length, idx=activeGymkana.q;
  if(idx>=total){
    el.innerHTML=`<div class="gymkana-game"><div class="gymkana-final"><div class="eyebrow">GYMKANA COMPLETADA</div><h3>🎉 ¡Enhorabuena!</h3><div class="big-score">${activeGymkana.score} puntos</div><p>Has completado las ${total} pruebas.</p><button type="button" class="gymkana-restart" id="restartGymkanaBtn">↻ Jugar de nuevo</button></div></div>`;
    if(activeGymkana.progressId) sb.from('gymkana_progress').update({current_challenge:total,score:activeGymkana.score,completed:true,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',activeGymkana.progressId);
    el.querySelector('#restartGymkanaBtn')?.addEventListener('click',()=>{activeGymkana={...activeGymkana,q:0,score:0,progressId:activeGymkana.progressId}; if(activeGymkana.progressId) sb.from('gymkana_progress').update({current_challenge:0,score:0,completed:false,completed_at:null,updated_at:new Date().toISOString()}).eq('id',activeGymkana.progressId); renderGymkanaQuestion();}); return;
  }
  const item=activeGymkanaChallenges[idx], pct=Math.round(idx/total*100), type=item.challenge_type||'quiz';
  if(type!=='quiz'){
    el.innerHTML=`<div class="gymkana-game"><div class="gymkana-game-head"><div><div class="eyebrow">PRUEBA ${idx+1} DE ${total}</div><h3>${esc(activeGymkana.name)}</h3></div><div class="gymkana-score">⭐ ${activeGymkana.score}</div></div><div class="gymkana-progress"><i style="width:${pct}%"></i></div><span class="challenge-badge">${type==='qr'?'📱 QR':type==='camera'?'📷 CÁMARA':'📍 GEOLOCALIZACIÓN'}</span><p class="gymkana-question">${esc(item.title||'Prueba presencial')}</p><p class="small">Esta prueba ya está preparada en el modelo de Gymkanas. En la siguiente fase conectaremos su desbloqueo físico con el QR, la cámara y la posición GPS.</p><button type="button" class="gymkana-primary" id="skipPreviewBtn">Continuar prueba de desarrollo</button></div>`;
    el.querySelector('#skipPreviewBtn')?.addEventListener('click',()=>advanceGymkana(0)); return;
  }
  el.innerHTML=`<div class="gymkana-game"><div class="gymkana-game-head"><div><div class="eyebrow">PREGUNTA ${idx+1} DE ${total}</div><h3>${esc(activeGymkana.name)}</h3></div><div class="gymkana-score">⭐ ${activeGymkana.score}</div></div><div class="gymkana-progress"><i style="width:${pct}%"></i></div><p class="gymkana-question">${esc(item.q)}</p><div class="gymkana-options">${item.options.map((o,i)=>`<button type="button" class="gymkana-option" data-answer="${i}">${esc(o)}</button>`).join('')}</div><div class="gymkana-feedback" id="gymkanaFeedback"></div></div>`;
  el.querySelectorAll('.gymkana-option').forEach(btn=>btn.addEventListener('click',()=>answerGymkana(Number(btn.dataset.answer))));
}

async function advanceGymkana(points=0, answerText='', correct=false){
  const idx=activeGymkana.q, item=activeGymkanaChallenges[idx]; activeGymkana.score+=Number(points)||0; activeGymkana.q=idx+1;
  if(activeGymkana.progressId){
    await sb.from('gymkana_answers').upsert({progress_id:activeGymkana.progressId,challenge_id:item.id,answer_text:answerText,correct,points_awarded:Number(points)||0},{onConflict:'progress_id,challenge_id'});
    await sb.from('gymkana_progress').update({current_challenge:activeGymkana.q,score:activeGymkana.score,updated_at:new Date().toISOString()}).eq('id',activeGymkana.progressId);
  } else gymkanaSave({q:activeGymkana.q,score:activeGymkana.score,done:false});
  setTimeout(renderGymkanaQuestion,500);
}
async function answerGymkana(answer){
  const idx=activeGymkana.q, item=activeGymkanaChallenges[idx], buttons=[...document.querySelectorAll('.gymkana-option')], feedback=document.getElementById('gymkanaFeedback');
  buttons.forEach(b=>b.disabled=true); if(Number.isInteger(item.answer)) buttons[item.answer]?.classList.add('correct');
  const correct=Number(answer)===Number(item.answer), points=correct?Number(item.points||100):0;
  if(correct){feedback.textContent=`✅ ¡Correcto! +${points} puntos`;} else {buttons[answer]?.classList.add('wrong');feedback.textContent='❌ No es correcto. La respuesta correcta está marcada.';}
  await advanceGymkana(points,String(item.options?.[answer]||''),correct);
}

let businesses = [];
let targets = [];
let stream = null;
let timer = null;
let scanning = false;
let lastMatch = null;
let candidateMatch = null;
let candidateHits = 0;
let missHits = 0;
let cvReadyPromise = null;
let selectedBusiness = null;
let userPosition = null;
let navigationWatchId = null;
let headingHandler = null;
let navigationStarted = false;
let navigationStartDistance = null;
let routes = [];
let selectedRoute = null;
let activeRouteProgress = null;
const ROUTE_PROGRESS_PREFIX = 'ar_turismo_route_progress_v11_1_';

function configured() {
  return !!cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('TU-PROYECTO') &&
    !!cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('TU_PUBLISHABLE');
}

function waitForOpenCV() {
  if (window.cv && cv.Mat && cv.ORB) return Promise.resolve();
  if (cvReadyPromise) return cvReadyPromise;
  cvReadyPromise = new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.cv && cv.Mat && cv.ORB) return resolve();
      if (Date.now() - started > 20000) return reject(new Error('OpenCV no ha terminado de cargar. Recarga la página e inténtalo de nuevo.'));
      setTimeout(tick, 100);
    };
    tick();
  });
  return cvReadyPromise;
}

function createORB(nfeatures = 1000) {
  if (!window.cv || !cv.ORB) throw new Error('OpenCV ORB no está disponible. Comprueba que OpenCV.js haya cargado correctamente.');
  // OpenCV.js expone ORB como constructor en los builds actuales.
  try { return new cv.ORB(nfeatures); } catch (e) {
    // Compatibilidad con builds que expongan una función global ORB_create.
    if (typeof cv.ORB_create === 'function') return cv.ORB_create(nfeatures);
    throw e;
  }
}

function setDiag(msg) { diag.textContent = msg; }

async function loadImage(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';
  const loaded = new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen objetivo: ' + url));
  });
  img.src = url;
  return loaded;
}

function imageMat(img, max = 1000) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, w, h);
  return cv.imread(canvas);
}

function prepareTarget(b, img, orb) {
  const mat = imageMat(img);
  const gray = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
  const keypoints = new cv.KeyPointVector();
  const descriptors = new cv.Mat();
  orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);
  const target = {
    b,
    img,
    width: mat.cols,
    height: mat.rows,
    keypoints,
    descriptors,
    featureCount: keypoints.size()
  };
  mat.delete(); gray.delete();
  return target;
}

async function loadBusinesses(withTargets = true) {
  if (!configured()) throw new Error('CONFIG_ERROR: config.js no contiene una URL y Publishable Key válidas de Supabase.');

  setDiag('Conectando con Supabase…');
  if (bootStatus) bootStatus.textContent = '🔵 app.js ejecutado · conectando con Supabase…';
  if (supabaseInitError) console.warn('AR Turismo · supabase-js no disponible; usando REST para diagnosticar la base de datos.');
  if (placesList) placesList.innerHTML = '<div class="place-loading">🔄 Conectando con Supabase…</div>';

  // Consultamos REST directamente para poder mostrar errores HTTP reales y
  // evitar que una petición de supabase-js quede indefinidamente en espera.
  const base = String(cfg.SUPABASE_URL).replace(/\/$/, '');
  const url = `${base}/rest/v1/businesses?select=*&active=eq.true&order=name.asc`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: cfg.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e?.name === 'AbortError') {
      throw new Error('SUPABASE_TIMEOUT: Supabase no ha respondido en 12 segundos. Comprueba la conexión a Internet, la URL del proyecto y que Supabase esté disponible.');
    }
    throw new Error(`SUPABASE_NETWORK: ${e?.message || e}`);
  }
  clearTimeout(timeout);

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (_) {}

  if (!response.ok) {
    const detail = data?.message || data?.hint || data?.details || raw || response.statusText;
    throw new Error(`SUPABASE_HTTP_${response.status}: ${detail}`);
  }
  if (!Array.isArray(data)) {
    throw new Error('SUPABASE_DATA: Supabase respondió, pero el formato de los datos no es el esperado.');
  }

  businesses = data;
  targets = [];
  setDiag(`Supabase conectado · ${businesses.length} ${contentSingular.toLowerCase()}(s) activo(s) encontrado(s).`);
  if (bootStatus) bootStatus.textContent = `🟢 Supabase responde · ${businesses.length} ${contentSingular.toLowerCase()}(s) activo(s)`;
  if (placesList) {
    placesList.innerHTML = businesses.length
      ? `<div class="place-loading">✅ ${businesses.length} ${contentSingular.toLowerCase()}(s) encontrado(s). Preparando la lista…</div>`
      : '<div class="place-empty">⚠️ Supabase responde correctamente, pero no hay monumentos con <strong>active = true</strong>.</div>';
  }

  if (!businesses.length || !withTargets) {
    return { total: businesses.length, loaded: 0 };
  }

  await waitForOpenCV();
  const orb = createORB(1200);
  targets.forEach(t => { t.keypoints?.delete(); t.descriptors?.delete(); });
  targets = [];

  let loaded = 0;
  for (const b of businesses) {
    if (!b.target_path) continue;
    const base = String(cfg.SUPABASE_URL).replace(/\/$/, '');
    const url = `${base}/storage/v1/object/public/targets/${String(b.target_path).split('/').map(encodeURIComponent).join('/')}`;
    if (!url) continue;
    try {
      const img = await loadImage(url + (url.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(b.updated_at || Date.now()));
      const target = prepareTarget(b, img, orb);
      if (target.featureCount >= 12 && !target.descriptors.empty()) {
        targets.push(target);
        loaded++;
      }
    } catch (e) {
      console.warn('Objetivo no cargado', b.name, e);
    }
  }
  orb.delete();
  return { total: businesses.length, loaded };
}


async function loadCollaborators(){
  if(!collaboratorsList || !configured()) return [];
  const base=String(cfg.SUPABASE_URL).replace(/\/$/,'');
  try{
    const response=await fetch(`${base}/rest/v1/tourism_collaborators?select=*&active=eq.true&order=name.asc`,{headers:{apikey:cfg.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`}});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    collaborators=Array.isArray(data)?data:[];
    renderCollaborators();
    return collaborators;
  }catch(e){
    console.error('Error cargando colaboradores',e);
    collaboratorsList.innerHTML=`<div class="place-empty"><strong>No se pudieron cargar los colaboradores.</strong><p>${esc(e.message||e)}</p></div>`;
    return [];
  }
}
function collaboratorLogo(c){
  const path=String(c.logo_url||'').trim(); if(!path) return '';
  if(/^https?:\/\//i.test(path)) return path;
  return `${String(cfg.SUPABASE_URL).replace(/\/$/,'')}/storage/v1/object/public/collaborator-logos/${path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
}
function renderCollaborators(){
  if(!collaboratorsList) return;
  if(!collaborators.length){ collaboratorsList.innerHTML='<div class="place-empty"><strong>Aún no hay colaboradores publicados.</strong><p>Pronto podrás descubrir empresas y establecimientos asociados.</p></div>'; return; }
  collaboratorsList.innerHTML=collaborators.map(c=>{
    const type=c.collaborator_type==='sponsor'?'Patrocinador':c.collaborator_type==='recommended'?'Establecimiento recomendado':'Colaborador';
    const logo=collaboratorLogo(c);
    return `<article class="directory-collaborator-card">${logo?`<img src="${escAttr(logo)}" alt="" loading="lazy">`:'<div class="directory-collaborator-logo">🤝</div>'}<div class="directory-collaborator-body"><span>${type}</span><h4>${esc(c.name)}</h4>${c.description?`<p>${esc(c.description)}</p>`:''}<div class="directory-collaborator-links">${c.website?`<a href="${safeUrl(c.website)}" target="_blank" rel="noopener">Visitar web ↗</a>`:''}${c.phone?`<a href="tel:${escAttr(c.phone)}">☎ Contacto</a>`:''}${c.whatsapp?`<a href="https://wa.me/${encodeURIComponent(String(c.whatsapp).replace(/[^0-9+]/g,''))}" target="_blank" rel="noopener">WhatsApp</a>`:''}</div></div></article>`;
  }).join('');
}
function focusContentView(key){
  const target=contentViews[key];
  if(!target) return;
  requestAnimationFrame(()=>{
    target.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
function setContentView(view){
  const key=contentViews[view]?view:null;
  Object.entries(contentViews).forEach(([name,el])=>el?.classList.toggle('hidden',name!==key));
  contentChoices.forEach(btn=>btn.classList.toggle('active',!!key && btn.dataset.contentView===key));
  if(key==='monuments'){
    selectedRoute = null;
    activeRouteProgress = null;
    document.getElementById('routeDetailOverlay')?.remove();
    renderPlaces();
    focusContentView(key);
  }
  if(key==='collaborators'){
    if(!collaborators.length) loadCollaborators();
    focusContentView(key);
  }
  if(key==='routes'){
    if(!routes.length) loadRoutes();
    focusContentView(key);
  }
}
contentChoices.forEach(btn=>btn.addEventListener('click',()=>setContentView(btn.dataset.contentView)));
if(sb?.auth){ sb.auth.onAuthStateChange(()=>{ setTimeout(async()=>{await refreshPlayer(); if(contentViews.gymkanas && !contentViews.gymkanas.classList.contains('hidden')){renderPlayerAuth();renderGymkanas();}},0); }); }


async function loadRoutes() {
  if (!routesList || !configured()) return [];
  const base = String(cfg.SUPABASE_URL).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}/rest/v1/tourism_routes?select=*&active=eq.true&order=name.asc`, {
      headers: { apikey: cfg.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`, Accept: 'application/json' },
      cache: 'no-store', signal: controller.signal
    });
    const raw = await response.text();
    let data = null; try { data = raw ? JSON.parse(raw) : null; } catch (_) {}
    if (!response.ok) {
      const detail = data?.message || data?.hint || data?.details || raw || response.statusText;
      if (response.status === 404 || response.status === 400) throw new Error('La estructura de rutas todavía no está creada en Supabase. Ejecuta schema_v11_0.sql.');
      throw new Error(detail);
    }
    routes = Array.isArray(data) ? data : [];
    try {
      const relResponse = await fetch(`${base}/rest/v1/tourism_route_places?select=route_id&active=eq.true`, {
        headers: { apikey: cfg.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`, Accept: 'application/json' },
        cache: 'no-store', signal: controller.signal
      });
      const relRaw = await relResponse.text();
      let relData = []; try { relData = relRaw ? JSON.parse(relRaw) : []; } catch (_) {}
      if (relResponse.ok && Array.isArray(relData)) {
        const counts = relData.reduce((m, x) => { m[x.route_id] = (m[x.route_id] || 0) + 1; return m; }, {});
        routes = routes.map(r => ({ ...r, _placeCount: counts[r.id] || 0 }));
      }
    } catch (_) {}
    renderRoutes();
    return routes;
  } catch (e) {
    console.warn('AR Turismo · rutas', e);
    routesList.innerHTML = `<div class="place-empty routes-empty"><strong>Rutas no disponibles todavía</strong><p>${esc(e?.message || e)}</p></div>`;
    return [];
  } finally { clearTimeout(timeout); }
}
function formatRouteMeta(route, count) {
  const bits = [];
  if (count) bits.push(`${count} ${count === 1 ? 'lugar' : 'lugares'}`);
  if (Number.isFinite(Number(route.distance_meters)) && Number(route.distance_meters) > 0) bits.push(formatDistance(Number(route.distance_meters)));
  if (Number.isFinite(Number(route.duration_minutes)) && Number(route.duration_minutes) > 0) bits.push(`${Math.round(Number(route.duration_minutes))} min`);
  return bits.join(' · ') || 'Itinerario turístico';
}
function renderRoutes() {
  if (!routesList) return;
  if (!routes.length) {
    routesList.innerHTML = '<div class="routes-empty"><strong>Aún no hay rutas publicadas.</strong><p>Pronto podrás recorrer itinerarios turísticos por distintos lugares.</p></div>';
    return;
  }
  routesList.innerHTML = routes.map(r => `<article class="route-card" data-route-card-id="${escAttr(r.id)}" tabindex="0" role="button"><div class="route-cover">${r.cover_url && /^https?:\/\//i.test(r.cover_url) ? `<img src="${escAttr(r.cover_url)}" alt="" loading="lazy">` : '<span>🗺️</span>'}</div><div class="route-card-body"><div class="route-kicker">${esc(r.category || 'Ruta turística')}</div><h3>${esc(r.name)}</h3><p>${esc(r.description || 'Recorrido por varios lugares de interés.')}</p><div class="route-meta"><span>📍 ${formatRouteMeta(r, r._placeCount || 0)}</span></div><button type="button" class="route-open" data-route-id="${escAttr(r.id)}">Ver ruta →</button></div></article>`).join('');
  routesList.querySelectorAll('.route-open').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openRouteDetail(btn.dataset.routeId).catch(err => { console.error('AR Turismo · error al abrir ruta', err); setDiag('No se pudo abrir la ruta: ' + (err?.message || err)); });
  }));
  routesList.querySelectorAll('[data-route-card-id]').forEach(card => card.addEventListener('click', () => {
    openRouteDetail(card.dataset.routeCardId).catch(err => { console.error('AR Turismo · error al abrir ruta', err); setDiag('No se pudo abrir la ruta: ' + (err?.message || err)); });
  }));
}
async function openRouteDetail(routeId) {
  const route = routes.find(r => String(r.id) === String(routeId));
  if (!route) { setDiag('No se encontró la ruta seleccionada.'); return; }
  const base = String(cfg.SUPABASE_URL).replace(/\/$/, '');
  const response = await fetch(`${base}/rest/v1/tourism_route_places?select=sort_order,business_id&route_id=eq.${encodeURIComponent(route.id)}&active=eq.true&order=sort_order.asc`, {
    headers: { apikey: cfg.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`, Accept: 'application/json' }, cache: 'no-store'
  });
  const raw = await response.text(); let rows = []; try { rows = raw ? JSON.parse(raw) : []; } catch (_) {}
  if (!response.ok) { setDiag('No se pudo cargar esta ruta: ' + (rows?.message || raw || response.statusText)); return; }
  const places = rows.map(x => businesses.find(b => String(b.id) === String(x.business_id))).filter(Boolean);
  selectedRoute = { ...route, places };
  activeRouteProgress = loadRouteProgress(route.id, places.length);
  renderRouteDetail();
}
function routeProgressKey(routeId){ return ROUTE_PROGRESS_PREFIX + String(routeId); }
function loadRouteProgress(routeId, total){
  try{
    const raw=localStorage.getItem(routeProgressKey(routeId));
    const n=raw ? Math.max(0, Math.min(Number(raw), total)) : 0;
    const completed=Number.isFinite(n) ? Math.floor(n) : 0;
    return {completed};
  }catch(_){ return {completed:0}; }
}
function saveRouteProgress(routeId, completed){
  try{ localStorage.setItem(routeProgressKey(routeId), String(completed)); }catch(_){ }
}
function isRouteComplete(){
  return !!selectedRoute && !!activeRouteProgress && activeRouteProgress.completed >= (selectedRoute.places||[]).length;
}
function currentRoutePlace(){
  if(!selectedRoute) return null;
  const places=selectedRoute.places||[];
  return places[activeRouteProgress?.completed || 0] || null;
}

let routeMapInstance = null;
function estimateRouteStats(route, places){
  const configuredDistance=Number(route?.distance_meters);
  const configuredDuration=Number(route?.duration_minutes);
  let distance=Number.isFinite(configuredDistance)&&configuredDistance>0?configuredDistance:0;
  if(!distance){
    for(let i=1;i<places.length;i++){
      const a=places[i-1], b=places[i];
      if(Number.isFinite(Number(a.latitude))&&Number.isFinite(Number(a.longitude))&&Number.isFinite(Number(b.latitude))&&Number.isFinite(Number(b.longitude))){
        distance+=haversine(Number(a.latitude),Number(a.longitude),Number(b.latitude),Number(b.longitude));
      }
    }
  }
  const duration=Number.isFinite(configuredDuration)&&configuredDuration>0?configuredDuration:(distance>0?(distance/4500)*60:0);
  return {distance,duration};
}
function routeDifficulty(route, places){
  const explicit=String(route?.difficulty||'').toLowerCase();
  if(['easy','facil','fácil'].includes(explicit)) return {key:'easy',label:'Fácil',icon:'🟢'};
  if(['medium','moderate','moderada','media'].includes(explicit)) return {key:'medium',label:'Moderada',icon:'🟠'};
  if(['hard','difficult','difícil','dificil'].includes(explicit)) return {key:'hard',label:'Difícil',icon:'🔴'};
  const stats=estimateRouteStats(route,places);
  const km=stats.distance/1000, min=stats.duration;
  const key=(km>6||min>120)?'hard':(km>3||min>60||places.length>7)?'medium':'easy';
  return {key,label:key==='hard'?'Difícil':key==='medium'?'Moderada':'Fácil',icon:key==='hard'?'🔴':key==='medium'?'🟠':'🟢'};
}
async function initRouteMap(places){
  const el=document.getElementById('routeMap');
  if(!el || !window.L) return;
  const valid=places.filter(b=>Number.isFinite(Number(b.latitude))&&Number.isFinite(Number(b.longitude)));
  if(!valid.length){ el.innerHTML='<div class="route-map-empty">📍 Esta ruta todavía no tiene coordenadas suficientes para mostrar el mapa.</div>'; return; }
  if(routeMapInstance){ try{routeMapInstance.remove();}catch(_){} routeMapInstance=null; }
  routeMapInstance=L.map(el,{scrollWheelZoom:false,zoomControl:true});
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri — Source: Esri, OpenStreetMap contributors'}).addTo(routeMapInstance);
  const fallback=()=>{
    const latlngs=valid.map(b=>[Number(b.latitude),Number(b.longitude)]);
    L.polyline(latlngs,{weight:5,opacity:.85,dashArray:'8 6'}).addTo(routeMapInstance);
    routeMapInstance.fitBounds(L.latLngBounds(latlngs),{padding:[24,24],maxZoom:16});
  };
  let routed=false;
  if(valid.length>=2){
    try{
      const payload={locations:valid.map(b=>({lat:Number(b.latitude),lon:Number(b.longitude)})),costing:'pedestrian',units:'kilometers',shape_format:'polyline6'};
      const endpoints=['https://valhalla1.openstreetmap.de/route','https://valhalla.openstreetmap.de/route'];
      let res=null;
      for(const endpoint of endpoints){ try{ const rr=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Client-Id':'AR-Turismo-Jaen/1.0'},body:JSON.stringify(payload)}); if(rr.ok){res=rr;break;} }catch(_){ } }
      if(res && res.ok){
        const data=await res.json();
        const decodePolyline6=(encoded)=>{
          let index=0,lat=0,lon=0,out=[];
          while(index<encoded.length){
            let shift=0,result=0,byte;
            do{byte=encoded.charCodeAt(index++)-63;result|=(byte&31)<<shift;shift+=5;}while(byte>=32);
            const dlat=(result&1)?~(result>>1):(result>>1);lat+=dlat;
            shift=0;result=0;
            do{byte=encoded.charCodeAt(index++)-63;result|=(byte&31)<<shift;shift+=5;}while(byte>=32);
            const dlon=(result&1)?~(result>>1):(result>>1);lon+=dlon;
            out.push([lon/1e6,lat/1e6]);
          }
          return out;
        };
        const coords=data?.trip?.legs?.flatMap(leg=>{
          const shape=leg?.shape;
          if(typeof shape==='string') return decodePolyline6(shape);
          if(shape?.coordinates) return shape.coordinates;
          return [];
        })||[];
        if(coords.length>=2){
          const latlngs=coords.map(c=>[Number(c[1]),Number(c[0])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]));
          if(latlngs.length>=2){
            L.polyline(latlngs,{weight:5,opacity:.9}).addTo(routeMapInstance);
            routeMapInstance.fitBounds(L.latLngBounds(latlngs),{padding:[24,24],maxZoom:16});
            routed=true;
          }
        }
      }
    }catch(_){ }
  }
  if(!routed) fallback();
  valid.forEach((b)=>{
    const idx=places.indexOf(b)+1;
    L.marker([Number(b.latitude),Number(b.longitude)],{title:b.name}).addTo(routeMapInstance).bindPopup(`<strong>${idx}. ${esc(b.name)}</strong>`);
  });
  setTimeout(()=>routeMapInstance?.invalidateSize(),100);
}
function renderRouteDetail(){
  if(!selectedRoute) return;
  const existing=document.getElementById('routeDetailOverlay'); existing?.remove();
  const r=selectedRoute, places=r.places||[];
  const completed=activeRouteProgress?.completed || 0;
  const complete=completed>=places.length && places.length>0;
  const stats=estimateRouteStats(r,places);
  const difficulty=routeDifficulty(r,places);
  const overlay=document.createElement('div'); overlay.id='routeDetailOverlay'; overlay.className='route-detail-overlay';
  overlay.innerHTML=`<div class="route-detail-card"><button type="button" class="route-detail-close" aria-label="Cerrar">✕</button><div class="route-detail-cover">${r.cover_url&&/^https?:\/\//i.test(r.cover_url)?`<img src="${escAttr(r.cover_url)}" alt="">`:'<span>🗺️</span>'}</div><div class="route-detail-content"><div class="route-kicker">${esc(r.category||'Ruta turística')}</div><h2>${esc(r.name)}</h2><p class="route-detail-description">${esc(r.description||'')}</p><div class="route-detail-summary"><strong>${places.length} ${places.length===1?'lugar':'lugares'}</strong>${stats.distance>0?`<span>📏 ${formatDistance(stats.distance)}</span>`:''}${stats.duration>0?`<span>🚶 ${Math.round(stats.duration)} min a pie</span>`:''}<span class="route-difficulty route-difficulty-${difficulty.key}">${difficulty.icon} Dificultad: <strong>${difficulty.label}</strong></span></div><div class="route-map-note">🚶 Trazado peatonal por calles y caminos</div><div id="routeMap" class="route-map" aria-label="Mapa de la ruta"></div>${places.length?`<div class="route-progress-box"><div><strong>Progreso de la ruta</strong><span>${completed} / ${places.length} completados</span></div><div class="route-progress-track"><i style="width:${Math.round((completed/places.length)*100)}%"></i></div></div>`:''}<div class="route-stop-list">${places.length?places.map((b,i)=>{const done=i<completed, current=i===completed&&!complete; const clickable=done||current; return `<button type="button" class="route-stop ${done?'route-stop-done':''} ${current?'route-stop-current':''} ${!done&&!current?'route-stop-locked':''}" data-route-stop-id="${escAttr(b.id)}" ${clickable?'':'disabled'}><span class="route-stop-number">${done?'✓':i+1}</span><span><strong>${esc(b.name)}</strong><small>${done?'Completado':current?'Siguiente parada':'Bloqueado hasta completar la anterior'}</small></span><span>${done?'✓':current?'→':'🔒'}</span></button>`;}).join(''):'<p class="small">Esta ruta todavía no tiene lugares asociados.</p>'}</div>${places.length?(complete?`<div class="route-complete-banner"><strong>🎉 ¡Ruta completada!</strong><span>Has visitado todos los lugares de esta ruta.</span></div><button type="button" class="route-primary-action" id="restartRouteBtn">↻ Repetir ruta</button>`:`<div class="route-next-box"><div><span>PRÓXIMA PARADA</span><strong>${esc(places[completed].name)}</strong><small>Debes completar esta parada antes de continuar.</small></div><button type="button" class="route-primary-action" id="startRouteBtn">🧭 Comenzar ${completed?'siguiente parada':'ruta'}</button></div>`):''}</div></div>`;
  document.body.appendChild(overlay);
  initRouteMap(places);
  overlay.querySelector('.route-detail-close')?.addEventListener('click',()=>overlay.remove());
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  overlay.querySelectorAll('[data-route-stop-id]').forEach(btn=>btn.addEventListener('click',()=>{
    const b=places.find(x=>String(x.id)===String(btn.dataset.routeStopId));
    if(!b)return;
    if(btn.classList.contains('route-stop-done')){ overlay.remove(); showBusiness(b,{routeMode:true,routeCompleted:true}); return; }
    overlay.remove(); startRoutePlace(b);
  }));
  overlay.querySelector('#startRouteBtn')?.addEventListener('click',()=>{
    const b=currentRoutePlace(); if(!b)return;
    overlay.remove(); startRoutePlace(b);
  });
  overlay.querySelector('#restartRouteBtn')?.addEventListener('click',()=>{
    activeRouteProgress={completed:0}; saveRouteProgress(r.id,0); renderRouteDetail();
  });
}
function startRoutePlace(b){
  if(!selectedRoute)return;
  const expected=currentRoutePlace();
  if(!expected || String(expected.id)!==String(b.id)){
    setDiag('Esta parada está bloqueada. Debes seguir el orden de la ruta.');
    return;
  }
  selectedBusiness=b;
  selectDestination(b.id, {fromRoute:true});
}
function completeCurrentRoutePlace(b){
  if(!selectedRoute || !activeRouteProgress || !b)return false;
  const expected=currentRoutePlace();
  if(!expected || String(expected.id)!==String(b.id)) return false;
  const completed=Math.min((Number(activeRouteProgress.completed)||0)+1, selectedRoute.places.length);
  activeRouteProgress={completed};
  saveRouteProgress(selectedRoute.id,completed);
  return true;
}

async function start() {
  if (stream) return;
  if (!selectedBusiness) {
    setDiag(`Primero selecciona un ${contentSingular.toLowerCase()} de la lista.`);
    return;
  }
  startBtn.disabled = true;
  try {
    setDiag('Preparando reconocimiento del destino seleccionado…');
    const info = await loadBusinesses(true);
loadCollaborators();
    const selectedTargets = targets.filter(t => t.b.id === selectedBusiness.id);
    if (!selectedTargets.length) throw new Error(`El ${contentSingular.toLowerCase()} seleccionado no tiene una imagen de reconocimiento válida.`);
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no permite cámara. Usa HTTPS o localhost.');
    targets = selectedTargets;
    setDiag(`Destino preparado · ${selectedBusiness.name}`);
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    stopBtn.disabled = false;
    statusEl.textContent = cameraHint;
    setDiag(`Cámara activa · buscando: ${selectedBusiness.name}`);
    timer = setInterval(scan, 700);
  } catch (e) {
    startBtn.disabled = false;
    setDiag('Error: ' + (e?.message || e));
    console.error(e);
  }
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  scanning = false;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  video.srcObject = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = cameraHint;
  lastMatch = null;
  candidateMatch = null;
  candidateHits = 0;
  missHits = 0;
  result.classList.add('hidden');
}

function sceneFromVideo() {
  if (!video.videoWidth || !video.videoHeight) return null;
  const maxW = 640;
  const w = Math.min(maxW, video.videoWidth);
  const h = Math.round(w * video.videoHeight / video.videoWidth);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d', { willReadFrequently: true }).drawImage(video, 0, 0, w, h);
  const rgba = cv.imread(c);
  const gray = new cv.Mat();
  cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
  rgba.delete();
  return gray;
}

function verifyGeometry(target, scene, goodMatches) {
  if (goodMatches.length < 8) return 0;
  const src = cv.matFromArray(goodMatches.length, 1, cv.CV_32FC2, goodMatches.flatMap(m => {
    const p = target.keypoints.get(m.queryIdx).pt;
    return [p.x, p.y];
  }));
  const dst = cv.matFromArray(goodMatches.length, 1, cv.CV_32FC2, goodMatches.flatMap(m => {
    const p = scene._keypoints.get(m.trainIdx).pt;
    return [p.x, p.y];
  }));
  const mask = new cv.Mat();
  let inliers = 0;
  try {
    cv.findHomography(src, dst, cv.RANSAC, 5, mask, 2000, 0.995);
    for (let i = 0; i < mask.rows; i++) if (mask.ucharAt(i, 0)) inliers++;
  } catch (e) {
    console.warn('Homography', e);
  }
  src.delete(); dst.delete(); mask.delete();
  return inliers;
}

function scan() {
  if (scanning || !stream || video.readyState < 2 || !targets.length || !window.cv || lastMatch !== null) return;
  scanning = true;
  let scene = null, kp2 = null, des2 = null, orb = null;
  try {
    scene = sceneFromVideo();
    if (!scene) return;
    orb = createORB(1000);
    kp2 = new cv.KeyPointVector();
    des2 = new cv.Mat();
    orb.detectAndCompute(scene, new cv.Mat(), kp2, des2);
    if (des2.empty() || kp2.size() < 10) {
      statusEl.textContent = 'Buscando imagen…';
      return;
    }

    // Attach scene keypoints temporarily for geometric verification.
    scene._keypoints = kp2;
    let best = null;
    const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);

    for (const target of targets) {
      const matches = new cv.DMatchVectorVector();
      try {
        bf.knnMatch(target.descriptors, des2, matches, 2);
        const good = [];
        for (let i = 0; i < matches.size(); i++) {
          const pair = matches.get(i);
          if (pair.size() >= 2) {
            const m1 = pair.get(0), m2 = pair.get(1);
            if (m1.distance < 0.72 * m2.distance && m1.distance < 75) good.push(m1);
          }
        }
        let inliers = 0;
        if (good.length >= 8) inliers = verifyGeometry(target, scene, good);
        const score = inliers * 3 + good.length;
        if (!best || score > best.score) best = { b: target.b, good: good.length, inliers, score };
      } finally {
        matches.delete();
      }
    }

    // No mostramos la ficha ante una sola coincidencia. Exigimos que el mismo
    // objetivo sea detectado de forma consistente en varias capturas consecutivas.
    const strong = best && best.inliers >= 10 && best.good >= 14;
    if (strong) {
      missHits = 0;
      if (candidateMatch === best.b.id) candidateHits++;
      else {
        candidateMatch = best.b.id;
        candidateHits = 1;
      }

      if (candidateHits >= 3) {
        if (lastMatch !== best.b.id) {
          lastMatch = best.b.id;
          const routeWasActive = !!selectedRoute && !!activeRouteProgress;
          // En una ruta, la parada activa es la única referencia válida.
          // El objeto devuelto por OpenCV puede proceder de otra carga de businesses,
          // por lo que no debemos depender de la identidad del objeto JavaScript.
          const routeTarget = routeWasActive ? currentRoutePlace() : null;
          const recognizedId = String(best.b?.id || '');
          const expectedId = String(routeTarget?.id || selectedBusiness?.id || '');
          const routeCompleted = routeWasActive && recognizedId === expectedId
            ? completeCurrentRoutePlace(routeTarget)
            : false;
          if (routeWasActive) stop();
          showBusiness(best.b, {routeCompleted, routeMode: routeWasActive});
        }
        statusEl.textContent = `Imagen reconocida · ${best.b.name}`;
        setDiag(`Reconocimiento confirmado · ${best.good} coincidencias · ${best.inliers} geométricas`);
      } else {
        statusEl.textContent = 'Verificando imagen…';
        setDiag(`Verificando… ${candidateHits}/3 capturas válidas`);
      }
    } else {
      candidateMatch = null;
      candidateHits = 0;
      missHits++;
      statusEl.textContent = 'Buscando imagen…';
      // Una vez confirmada una ficha, ya no se oculta por perder el encuadre.
      // El usuario decide cuándo cerrar y volver a escanear.
      if (best) setDiag(`Buscando… mejor resultado descartado (${best.good} coincidencias / ${best.inliers} geométricas)`);
    }
  } catch (e) {
    console.warn('scan', e);
    setDiag('Error durante reconocimiento: ' + (e?.message || e));
  } finally {
    if (scene) { delete scene._keypoints; scene.delete(); }
    if (kp2) kp2.delete();
    if (des2) des2.delete();
    if (orb) orb.delete();
    scanning = false;
  }
}

let viewerImages = [];
let viewerIndex = 0;
let viewerScale = 1;

function sanitizeRichHTML(html){const doc=new DOMParser().parseFromString(String(html||''),'text/html');const allowed=new Set(['P','BR','STRONG','B','EM','I','U','H2','H3','UL','OL','LI','BLOCKQUOTE','A']);doc.body.querySelectorAll('*').forEach(el=>{if(!allowed.has(el.tagName)){el.replaceWith(...Array.from(el.childNodes));return}Array.from(el.attributes).forEach(a=>{if(el.tagName==='A' && a.name==='href' && /^https?:\/\//i.test(a.value)){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer')}else el.removeAttribute(a.name)})});return doc.body.innerHTML}
function haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
function bearingTo(lat1,lon1,lat2,lon2){const toRad=x=>x*Math.PI/180,toDeg=x=>x*180/Math.PI,y=Math.sin(toRad(lon2-lon1))*Math.cos(toRad(lat2)),x=Math.cos(toRad(lat1))*Math.sin(toRad(lat2))-Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lon2-lon1));return (toDeg(Math.atan2(y,x))+360)%360}
function cardinal(deg){return ['N','NE','E','SE','S','SO','O','NO'][Math.round(deg/45)%8]}
function formatDistance(meters) {
  if (!Number.isFinite(meters)) return 'Distancia no disponible';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

function validCoordinates(b) {
  return Number.isFinite(Number(b?.latitude)) && Number.isFinite(Number(b?.longitude)) &&
    Math.abs(Number(b.latitude)) <= 90 && Math.abs(Number(b.longitude)) <= 180;
}

function renderPlaces() {
  if (!placesList) return;
  if (!businesses.length) {
    placesList.innerHTML = `<div class="place-empty">No hay ${contentPlural.toLowerCase()} activos disponibles.</div>`;
    return;
  }

  const items = businesses.map(b => {
    const hasCoords = validCoordinates(b);
    const distance = userPosition && hasCoords
      ? haversine(userPosition.latitude, userPosition.longitude, Number(b.latitude), Number(b.longitude))
      : null;
    return { b, distance, hasCoords };
  });

  // Siempre mostramos todos los monumentos. Cuando hay GPS, los más cercanos
  // pasan arriba; si no, se conserva el orden alfabético de Supabase.
  items.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;
    return String(a.b.name || '').localeCompare(String(b.b.name || ''), 'es');
  });

  placesList.innerHTML = items.map(({b, distance, hasCoords}) => {
    const category = String(b.category || 'Patrimonio y cultura');
    const icon = /castillo|fortaleza|torre/i.test(category + ' ' + (b.name||'')) ? '🏰' : /iglesia|catedral|ermita|basílica/i.test(category + ' ' + (b.name||'')) ? '⛪' : /museo/i.test(category + ' ' + (b.name||'')) ? '🏛️' : '🏛️';
    const distanceHtml = distance !== null ? `<strong>📍 ${formatDistance(distance)}</strong><span>desde tu ubicación</span>` : (hasCoords ? '<strong>📍 Distancia pendiente</strong><span>Activa tu ubicación</span>' : '<strong>🧭 Sin coordenadas</strong><span>No disponible para navegación</span>');
    return `
    <article class="place-card" data-business-card-id="${escAttr(b.id)}" tabindex="0" role="button" aria-label="Seleccionar ${escAttr(b.name || 'monumento')}">
      <div class="place-icon" aria-hidden="true">${icon}</div>
      <div class="place-info">
        <div class="place-category">${esc(category)}</div>
        <h3>${esc(b.name || 'Monumento')}</h3>
        ${b.address ? `<p class="place-address">📍 ${esc(b.address)}</p>` : ''}
        <div class="place-distance">${distanceHtml}</div>
      </div>
      <button class="place-select" type="button" data-business-id="${escAttr(b.id)}" title="Seleccionar ${escAttr(b.name || 'monumento')}">
        <span>${hasCoords ? '🧭' : '📷'}</span> ${hasCoords ? 'Ir allí' : 'Ver y reconocer'}
      </button>
    </article>`;
  }).join('');

  const choosePlace = (id) => {
    try { selectDestination(id); } catch (e) {
      console.error('AR Turismo · error al seleccionar monumento', e);
      setDiag('No se pudo abrir el monumento: ' + (e?.message || e));
    }
  };
  placesList.querySelectorAll('.place-select').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); choosePlace(btn.dataset.businessId); });
  });
  placesList.querySelectorAll('[data-business-card-id]').forEach(card => {
    card.addEventListener('click', () => choosePlace(card.dataset.businessCardId));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choosePlace(card.dataset.businessCardId); } });
  });
}

function setLocationStatus(message, state = '') {
  if (!locationStatus) return;
  locationStatus.textContent = message;
  locationStatus.dataset.state = state;
}

function handleLocationSuccess(position) {
  const c = position?.coords;
  if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) {
    setLocationStatus('⚠️ El navegador no ha devuelto una ubicación válida.', 'error');
    return;
  }

  userPosition = {
    latitude: c.latitude,
    longitude: c.longitude,
    accuracy: Number.isFinite(c.accuracy) ? c.accuracy : null,
    timestamp: position.timestamp || Date.now()
  };

  const accuracyText = userPosition.accuracy ? ` · precisión ±${Math.round(userPosition.accuracy)} m` : '';
  setLocationStatus(`✅ Ubicación actualizada${accuracyText}. Los ${contentPlural.toLowerCase()} están ordenados por cercanía.`, 'ok');
  if (locateBtn) locateBtn.textContent = '📍 Actualizar ubicación';
  renderPlaces();

  if (navigationWatchId !== null && selectedBusiness) updateNavigationPosition(position);
}

function handleLocationError(error) {
  const messages = {
    1: 'Permiso de ubicación denegado. Puedes ver la lista igualmente; para ordenar por distancia, permite la ubicación en el navegador.',
    2: 'No se ha podido determinar tu ubicación. Comprueba que la ubicación/GPS esté activada e inténtalo de nuevo.',
    3: 'La búsqueda de ubicación ha tardado demasiado. Comprueba que el GPS esté activo e inténtalo de nuevo.'
  };
  const message = messages[error?.code] || `No se ha podido obtener tu ubicación. Puedes consultar los ${contentPlural.toLowerCase()} igualmente.`;
  setLocationStatus(`⚠️ ${message}`, 'error');
  if (locateBtn) locateBtn.disabled = false;
  renderPlaces();
}

function startLocationWatch() {
  if (!navigator.geolocation) {
    setLocationStatus(`⚠️ Este navegador no ofrece geolocalización. Puedes consultar los ${contentPlural.toLowerCase()} igualmente.`, 'error');
    renderPlaces();
    return null;
  }

  if (navigationWatchId !== null) {
    // No reutilizamos el watcher de navegación para la pantalla de destinos.
    navigator.geolocation.clearWatch(navigationWatchId);
    navigationWatchId = null;
  }

  setLocationStatus('📍 Buscando tu ubicación…', 'loading');
  if (locateBtn) {
    locateBtn.disabled = true;
    locateBtn.textContent = '📍 Localizando…';
  }

  try {
    return navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  } catch (e) {
    handleLocationError({ code: 2, message: e.message });
    return null;
  }
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    handleLocationError({ code: 2 });
    return;
  }

  // La primera posición se solicita inmediatamente para que la lista se ordene
  // cuanto antes. Después watchPosition mantiene la ubicación actualizada.
  setLocationStatus('📍 Solicitando tu ubicación…', 'loading');
  if (locateBtn) {
    locateBtn.disabled = true;
    locateBtn.textContent = '📍 Localizando…';
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      handleLocationSuccess(position);
      if (navigationWatchId === null) {
        navigationWatchId = startLocationWatch();
      }
      if (locateBtn) locateBtn.disabled = false;
    },
    error => {
      handleLocationError(error);
      // Incluso si la primera lectura falla, dejamos un watch activo para
      // permitir que una posterior recuperación del GPS actualice la lista.
      if (navigationWatchId === null && error?.code !== 1) {
        navigationWatchId = startLocationWatch();
      }
      if (locateBtn) locateBtn.disabled = false;
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
}

function selectDestination(id, options = {}) {
  const found = businesses.find(b => String(b.id) === String(id));
  if (!found) return;
  if (selectedRoute && !options.fromRoute) {
    const expected=currentRoutePlace();
    if (!expected || String(expected.id)!==String(id)) {
      setDiag('Esta parada está bloqueada. Debes seguir el orden de la ruta.');
      if (selectedRoute) renderRouteDetail();
      return;
    }
  }
  selectedBusiness = found;
  stop();
  if (!validCoordinates(found)) {
    placesPanel?.classList.add('hidden');
    navigationPanel?.classList.add('hidden');
    cameraPanel?.classList.remove('hidden');
    setDiag(`Destino seleccionado · ${found.name}. No tiene coordenadas, así que puedes activar directamente la cámara.`);
    return;
  }
  stopNavigationTracking();
  placesPanel?.classList.add('hidden');
  cameraPanel?.classList.add('hidden');
  navigationPanel?.classList.remove('hidden');

  if (navTitle) navTitle.textContent = found.name || 'Monumento';
  if (navSubtitle) navSubtitle.textContent = found.address || 'Sigue la flecha hasta llegar al lugar.';
  if (arrivedBtn) arrivedBtn.textContent = '📷 He llegado · Activar cámara';
  navigationStartDistance = null;
  if (document.getElementById('directionArrow')) document.getElementById('directionArrow').style.transform = 'rotate(0deg)';
  const directionMessage = document.getElementById('directionMessage');
  if (directionMessage) directionMessage.textContent = 'Orientando hacia el destino…';
  if (document.getElementById('navPermission')) document.getElementById('navPermission').textContent = '';

  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${found.latitude},${found.longitude}`)}`;
  const route = document.getElementById('openRoute');
  if (route) route.href = routeUrl;

  if (userPosition) {
    const initialDistance = haversine(userPosition.latitude, userPosition.longitude, Number(found.latitude), Number(found.longitude));
    navigationStartDistance = initialDistance > 25 ? initialDistance : null;
    updateNavigationPosition({ coords: userPosition });
  } else {
    if (navDistance) navDistance.textContent = 'Activa la ubicación para calcular la distancia.';
    if (navDistanceLarge) navDistanceLarge.textContent = '📍 Distancia pendiente';
    navigationStartDistance = null;
  }
  // Al seleccionar un monumento con coordenadas, activamos automáticamente
  // la dirección. El propio clic del usuario permite solicitar los permisos
  // de geolocalización/orientación en dispositivos compatibles.
  try {
    activateNavigation();
  } catch (e) {
    console.warn('AR Turismo · no se pudo activar automáticamente la dirección', e);
  }
  const progressBar = document.getElementById('navProgressBar');
  if (progressBar) progressBar.style.width = '0%';
  const progressText = document.getElementById('navProgressText');
  if (progressText) progressText.textContent = 'Calculando progreso…';
  const etaText = document.getElementById('navEta');
  if (etaText) etaText.textContent = 'Calculando tiempo…';
  const accuracyText = document.getElementById('navAccuracy');
  if (accuracyText) accuracyText.textContent = 'Esperando GPS';
  setDiag(`Destino seleccionado · ${found.name}`);
}

function updateNavigationPosition(position) {
  if (!selectedBusiness || !validCoordinates(selectedBusiness) || !position?.coords) return;
  const lat = Number(position.coords.latitude), lon = Number(position.coords.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

  userPosition = {
    latitude: lat,
    longitude: lon,
    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : userPosition?.accuracy || null,
    timestamp: position.timestamp || Date.now()
  };

  const distance = haversine(lat, lon, Number(selectedBusiness.latitude), Number(selectedBusiness.longitude));
  const bearing = bearingTo(lat, lon, Number(selectedBusiness.latitude), Number(selectedBusiness.longitude));
  const direction = cardinal(bearing);
  const distanceText = distance <= 25
    ? `Estás a unos ${Math.round(distance)} m · Ya estás muy cerca`
    : formatDistance(distance);
  if (navigationStartDistance === null && distance > 25) navigationStartDistance = distance;
  const progress = navigationStartDistance ? Math.max(0, Math.min(100, Math.round((1 - distance / navigationStartDistance) * 100))) : 100;
  const etaMinutes = distance > 25 ? Math.max(1, Math.ceil(distance / 80)) : 0;
  const progressBar = document.getElementById('navProgressBar');
  const progressText = document.getElementById('navProgressText');
  const etaText = document.getElementById('navEta');
  const accuracyText = document.getElementById('navAccuracy');
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (progressText) progressText.textContent = distance <= 25 ? '🎉 Has llegado' : `${progress}% del trayecto`;
  if (etaText) etaText.textContent = distance <= 25 ? 'Listo para activar la cámara' : `🚶 Aproximadamente ${etaMinutes} min a pie`;
  if (accuracyText) accuracyText.textContent = userPosition.accuracy ? `GPS ±${Math.round(userPosition.accuracy)} m` : 'GPS activo';
  if (navDistance) navDistance.textContent = `📍 ${distanceText} · dirección ${direction} (${Math.round(bearing)}°)`;
  if (navDistanceLarge) navDistanceLarge.textContent = `📍 ${distanceText}`;

  if (arrivedBtn) {
    arrivedBtn.textContent = distance <= 25
      ? '📷 Ya estás aquí · Activar cámara'
      : '📷 He llegado · Activar cámara';
  }

  const navInfo = document.getElementById('navInfo');
  if (navInfo) navInfo.innerHTML = distance <= 25
    ? `<span class="small">Ya estás suficientemente cerca. Activa la cámara y enfoca el ${contentSingular.toLowerCase()}.</span>`
    : `<span class="small">Avanza hacia ${esc(selectedBusiness.name)}. La distancia se actualizará automáticamente.</span>`;

  if (navigationStarted) updateNavigationHeading({ coords: userPosition });
  renderPlaces();
}

function updateNavigationHeading(event) {
  if (!selectedBusiness || !userPosition || !validCoordinates(selectedBusiness)) return;
  const arrow = document.getElementById('directionArrow');
  const message = document.getElementById('directionMessage');
  if (!arrow) return;

  let heading = null;
  if (typeof event?.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) {
    heading = event.webkitCompassHeading;
  } else if (typeof event?.alpha === 'number' && Number.isFinite(event.alpha)) {
    heading = (360 - event.alpha) % 360;
  }
  if (!Number.isFinite(heading)) {
    if (message) message.textContent = '⚠️ El teléfono no está proporcionando orientación.';
    return;
  }

  const targetBearing = bearingTo(
    userPosition.latitude,
    userPosition.longitude,
    Number(selectedBusiness.latitude),
    Number(selectedBusiness.longitude)
  );
  const rotation = ((targetBearing - heading + 540) % 360) - 180;
  arrow.style.transform = `rotate(${rotation}deg)`;

  const abs = Math.abs(rotation);
  if (message) {
    if (abs <= 12) {
      message.textContent = '✅ ¡Perfecto! Camina hacia delante.';
      message.classList.add('direction-ready');
    } else if (rotation > 0) {
      message.textContent = `↻ Gira a la derecha ${Math.round(abs)}°`;
      message.classList.remove('direction-ready');
    } else {
      message.textContent = `↶ Gira a la izquierda ${Math.round(abs)}°`;
      message.classList.remove('direction-ready');
    }
  }
}

async function activateNavigation() {
  if (!selectedBusiness) return;
  if (!navigator.geolocation) {
    setLocationStatus('⚠️ Este navegador no permite geolocalización.', 'error');
    return;
  }

  const permissionText = document.getElementById('navPermission');
  if (permissionText) permissionText.textContent = 'Solicitando permisos de ubicación y orientación…';

  try {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission(true);
      if (permission !== 'granted') {
        if (permissionText) permissionText.textContent = '⚠️ Permiso de orientación no concedido. La distancia seguirá funcionando.';
      }
    }
  } catch (e) {
    console.warn('Permiso de orientación', e);
    if (permissionText) permissionText.textContent = '⚠️ No se pudo activar la brújula. La distancia seguirá funcionando.';
  }

  navigationStarted = true;
  window.addEventListener('deviceorientation', updateNavigationHeading, true);
  window.addEventListener('deviceorientationabsolute', updateNavigationHeading, true);

  if (navigationWatchId !== null) navigator.geolocation.clearWatch(navigationWatchId);
  navigationWatchId = navigator.geolocation.watchPosition(
    updateNavigationPosition,
    handleLocationError,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );

  if (permissionText) permissionText.textContent = '✅ Navegación activa. La distancia se actualizará mientras avanzas.';
  const button = document.getElementById('startNavigation');
  if (button) {
    button.disabled = true;
    button.textContent = '➡️ Dirección activa';
  }
}

function stopNavigationTracking() {
  if (navigationWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(navigationWatchId);
    navigationWatchId = null;
  }
  window.removeEventListener('deviceorientation', updateNavigationHeading, true);
  window.removeEventListener('deviceorientationabsolute', updateNavigationHeading, true);
  navigationStarted = false;
  const button = document.getElementById('startNavigation');
  if (button) {
    button.disabled = false;
    button.textContent = '➡️ Activar dirección';
  }
}

function openCameraForDestination() {
  if (!selectedBusiness) return;
  stopNavigationTracking();
  navigationPanel?.classList.add('hidden');
  placesPanel?.classList.add('hidden');
  cameraPanel?.classList.remove('hidden');
  start();
}

async function showBusiness(b, options = {}) {
  const routeMode = options.routeMode === true || (options.routeCompleted === true && !!selectedRoute);
  result.classList.remove('hidden');
  result.innerHTML = `<div class="premium-ficha ${routeMode ? 'route-ficha' : ''}">
    <div class="premium-topbar"><span class="premium-badge">${routeMode ? '🧭 RUTA GUIADA' : '✦ EXPERIENCIA AR'}</span><button id="closeResult" class="result-close" type="button" aria-label="Cerrar ficha">✕</button></div>
    <div class="premium-title"><div class="eyebrow dark">${routeMode ? 'PARADA DE LA RUTA' : 'LUGAR IDENTIFICADO'}</div><h2>${esc(b.name)}</h2><div class="premium-category">${esc(b.category || 'Patrimonio y cultura')}</div></div>
    <div id="premiumHero" class="premium-hero hidden"></div>
    ${routeMode ? '' : `<div class="premium-quick-actions">${b.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">📍 Cómo llegar</a>` : ''}${b.website ? `<a href="${safeUrl(b.website)}" target="_blank" rel="noopener">🌐 Sitio web</a>` : ''}${b.phone ? `<a href="tel:${escAttr(b.phone)}">☎ Contacto</a>` : ''}</div>`}
    ${b.description ? `<section class="premium-history"><div class="premium-section-kicker">HISTORIA Y PATRIMONIO</div><div class="history-content">${sanitizeRichHTML(b.description)}</div></section>` : ''}
    ${b.offer ? `<div class="premium-highlight"><span>✦ Información destacada</span><strong>${esc(b.offer)}</strong></div>` : ''}
    ${b.sponsor_name ? `<div class="premium-sponsor"><div><span>Con la colaboración de</span><strong>${esc(b.sponsor_name)}</strong></div>${b.sponsor_url ? `<a href="${safeUrl(b.sponsor_url)}" target="_blank" rel="noopener">Visitar colaborador ↗</a>` : ''}</div>` : ''}
    <div id="collaboratorsPublic" class="premium-collaborators"><p class="small">Cargando colaboradores…</p></div>
    <div id="mediaPublic" class="public-media"><p class="small">Preparando la experiencia multimedia…</p></div>
    ${routeMode ? '' : '<button id="rescanBtn" class="rescan-btn" type="button">↻ Escanear otro lugar</button>'}
  </div>`;
  document.getElementById('closeResult')?.addEventListener('click', closeResult);
  document.getElementById('rescanBtn')?.addEventListener('click', closeResult);
  if(options.routeCompleted && selectedRoute){
    const completed=activeRouteProgress?.completed||0, total=selectedRoute.places.length, next=selectedRoute.places[completed];
    const routeBox=document.createElement('section'); routeBox.className='route-result-banner route-result-guided';
    routeBox.innerHTML=completed>=total
      ? `<div><strong>🎉 Has completado la ruta</strong><span>${esc(selectedRoute.name)}</span></div><button type="button" id="routeFinishBtn">Ver final de la ruta</button>`
      : `<div><strong>✅ Parada completada · ${completed}/${total}</strong><span>La siguiente parada es ${esc(next.name)}</span><small>Continúa en orden para seguir la ruta.</small></div><button type="button" id="routeNextBtn">🧭 Ir al siguiente punto</button>`;
    result.querySelector('.premium-ficha')?.appendChild(routeBox);
    routeBox.querySelector('#routeNextBtn')?.addEventListener('click',()=>{ closeResult(); setTimeout(()=>startRoutePlace(next),50); });
    routeBox.querySelector('#routeFinishBtn')?.addEventListener('click',()=>{ closeResult(); setTimeout(()=>renderRouteDetail(),50); });
  }

  let data=[]; let mediaError=null;
  try {
    const base=String(cfg.SUPABASE_URL).replace(/\/$/,'');
    const mediaUrl=`${base}/rest/v1/business_media?select=*&business_id=eq.${encodeURIComponent(b.id)}&active=eq.true&order=sort_order.asc,created_at.asc`;
    const r=await fetch(mediaUrl,{headers:{apikey:cfg.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,Accept:'application/json'},cache:'no-store'});
    const raw=await r.text(); let json=null; try{json=raw?JSON.parse(raw):null}catch(_){}
    if(!r.ok) throw new Error(json?.message||raw||r.statusText);
    data=Array.isArray(json)?json:[];
  } catch(e) { mediaError=e; }

  const collaboratorEl=document.getElementById('collaboratorsPublic');
  if(collaboratorEl){
    try {
      const base=String(cfg.SUPABASE_URL).replace(/\/$/,'');
      const relUrl=`${base}/rest/v1/tourism_collaborator_places?select=role,sort_order,tourism_collaborators(id,name,collaborator_type,description,logo_url,website,phone,whatsapp,instagram)&business_id=eq.${encodeURIComponent(b.id)}&active=eq.true&order=sort_order.asc`;
      const rr=await fetch(relUrl,{headers:{apikey:cfg.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,Accept:'application/json'},cache:'no-store'});
      const raw=await rr.text(); let json=null; try{json=raw?JSON.parse(raw):null}catch(_){}
      if(!rr.ok) throw new Error(json?.message||raw||rr.statusText);
      const rows=(Array.isArray(json)?json:[]).filter(x=>x.tourism_collaborators);
      const logoUrl=x=>{
        const path=String(x.logo_url||'').trim();
        if(!path) return '';
        if(/^https?:\/\//i.test(path)) return path;
        return `${base}/storage/v1/object/public/collaborator-logos/${path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
      };
      if(rows.length){
        collaboratorEl.innerHTML=`<section class="premium-collaborators-section"><div class="premium-section-kicker">COLABORADORES</div><h3>Con el apoyo de</h3><div class="premium-collaborator-list">${rows.map(r=>{const c=r.tourism_collaborators; const label=r.role==='sponsor'?'Patrocinador principal':r.role==='recommended'?'Establecimiento recomendado':'Colaborador'; return `<article class="premium-collaborator-card">${logoUrl(c)?`<img src="${escAttr(logoUrl(c))}" alt="${escAttr(c.name)}" loading="lazy">`:`<div class="collaborator-logo-fallback">🤝</div>`}<div class="premium-collaborator-info"><span>${label}</span><strong>${esc(c.name)}</strong>${c.description?`<p>${esc(c.description)}</p>`:''}<div class="premium-collaborator-links">${c.website?`<a href="${safeUrl(c.website)}" target="_blank" rel="noopener">Visitar web ↗</a>`:''}${c.phone?`<a href="tel:${escAttr(c.phone)}">☎ Contacto</a>`:''}${c.whatsapp?`<a href="https://wa.me/${encodeURIComponent(String(c.whatsapp).replace(/[^0-9+]/g,''))}" target="_blank" rel="noopener">WhatsApp</a>`:''}</div></div></article>`}).join('')}</div></section>`;
      } else { collaboratorEl.innerHTML=''; }
    } catch(e){ collaboratorEl.innerHTML=`<div class="premium-media-empty premium-media-error"><span>⚠️</span><div><strong>No se pudieron cargar los colaboradores</strong><p>${esc(e.message||'Error al consultar colaboradores.')}</p></div></div>`; }
  }

  const el=document.getElementById('mediaPublic');
  if(!el)return;

  const hero=document.getElementById('premiumHero');
  const targetUrl = b.target_path
    ? `${String(cfg.SUPABASE_URL).replace(/\/$/,'')}/storage/v1/object/public/targets/${String(b.target_path).split('/').map(encodeURIComponent).join('/')}`
    : '';

  if(mediaError){
    el.innerHTML=`<div class="premium-media-empty premium-media-error"><span>⚠️</span><div><strong>No se pudo cargar el contenido multimedia</strong><p>${esc(mediaError.message || 'Error al consultar el contenido multimedia.')}</p></div></div>`;
  }

  const images=data.filter(x=>x.media_type==='image');
  const audios=data.filter(x=>x.media_type==='audio');
  const videos=data.filter(x=>x.media_type==='video');
  const mediaUrl=m=>{const bucket=m.media_type==='image'?'media-images':m.media_type==='audio'?'media-audio':'media-video'; const base=String(cfg.SUPABASE_URL).replace(/\/$/,''); return `${base}/storage/v1/object/public/${bucket}/${String(m.storage_path).split('/').map(encodeURIComponent).join('/')}`;};
  viewerImages=images.map(m=>({url:mediaUrl(m),title:m.title||b.name,description:m.description||''}));

  if(hero){
    if(images.length){
      const first=images[0];
      hero.innerHTML=`<button class="premium-hero-open" type="button" data-image-index="0"><img src="${escAttr(mediaUrl(first))}" alt="${escAttr(first.title||b.name)}"><span>🔍 Ver galería</span></button>`;
      hero.classList.remove('hidden');
      hero.querySelector('.premium-hero-open')?.addEventListener('click',()=>openImageViewer(0));
    } else if(targetUrl){
      hero.innerHTML=`<div class="premium-hero-image-only"><img src="${escAttr(targetUrl)}" alt="${escAttr(b.name)}"><span>Imagen del lugar</span></div>`;
      hero.classList.remove('hidden');
    }
  }

  let html='';
  if(images.length) html+=`<section class="premium-media-section"><div class="premium-section-head"><div><div class="premium-section-kicker">GALERÍA</div><h3>Descubre el lugar</h3></div><span class="small">${images.length} ${images.length===1?'imagen':'imágenes'}</span></div><div class="public-gallery">${images.map((m,i)=>`<figure><button class="gallery-open" type="button" data-image-index="${i}" aria-label="Ampliar imagen ${i+1}"><img src="${escAttr(mediaUrl(m))}" alt="${escAttr(m.title||b.name)}" loading="lazy"></button>${m.title?`<figcaption>${esc(m.title)}</figcaption>`:''}</figure>`).join('')}</div></section>`;
  if(audios.length) html+=`<section class="premium-media-section premium-audio-section"><div class="premium-section-kicker">AUDIOGUÍA</div><h3>Escucha la historia</h3>${audios.map(m=>`<article class="premium-audio"><div class="media-icon">🎧</div><div><strong>${esc(m.title||'Audioguía')}</strong>${m.description?`<p>${esc(m.description)}</p>`:''}<audio controls preload="metadata" src="${escAttr(mediaUrl(m))}"></audio></div></article>`).join('')}</section>`;
  if(videos.length) html+=`<section class="premium-media-section"><div class="premium-section-kicker">VÍDEO</div><h3>${historyTitle}</h3><div class="public-videos">${videos.map(m=>`<article><video controls playsinline preload="metadata" src="${escAttr(mediaUrl(m))}"></video><strong>${esc(m.title||'Vídeo del lugar')}</strong>${m.description?`<p>${esc(m.description)}</p>`:''}</article>`).join('')}</div></section>`;
  if(!data.length && !mediaError){
    html='<div class="premium-media-empty"><span>ℹ️</span><div><strong>Contenido multimedia</strong><p>Este lugar todavía no tiene contenidos multimedia publicados.</p></div></div>';
  }
  // v10.3 · lugares cercanos al contenido identificado
  let nearbyHtml='';
  if(!routeMode && validCoordinates(b)){
    const nearby=businesses
      .filter(x=>String(x.id)!==String(b.id) && validCoordinates(x))
      .map(x=>({b:x,distance:haversine(Number(b.latitude),Number(b.longitude),Number(x.latitude),Number(x.longitude))}))
      .filter(x=>x.distance<=5000)
      .sort((a,c)=>a.distance-c.distance)
      .slice(0,3);
    if(nearby.length){
      nearbyHtml=`<section class="premium-nearby-section"><div class="premium-section-kicker">CERCA DE AQUÍ</div><h3>Descubre otros lugares</h3><div class="premium-nearby-list">${nearby.map(({b:x,distance})=>`<article class="premium-nearby-card"><div><div class="premium-nearby-category">${esc(x.category||'Patrimonio y cultura')}</div><strong>${esc(x.name||'Lugar turístico')}</strong><span>📍 ${formatDistance(distance)}</span></div><button type="button" class="premium-nearby-btn" data-nearby-id="${escAttr(x.id)}">Ver ficha</button></article>`).join('')}</div></section>`;
    }
  }
  if(nearbyHtml) html+=nearbyHtml;
  el.innerHTML=html;
  el.querySelectorAll('.gallery-open').forEach(btn=>btn.addEventListener('click',()=>openImageViewer(Number(btn.dataset.imageIndex))));
  if(!routeMode) el.querySelectorAll('.premium-nearby-btn').forEach(btn=>btn.addEventListener('click',()=>{const nearby=businesses.find(x=>String(x.id)===String(btn.dataset.nearbyId));if(nearby)showBusiness(nearby);}));
}

function openImageViewer(index){
  if(!viewerImages.length)return;
  viewerIndex=Math.max(0,Math.min(index,viewerImages.length-1));
  viewerScale=1;
  updateImageViewer();
  const viewer=document.getElementById('imageViewer');
  viewer?.classList.remove('hidden');
  viewer?.setAttribute('aria-hidden','false');
  document.body.classList.add('viewer-open');
}
function updateImageViewer(){
  const item=viewerImages[viewerIndex];
  const img=document.getElementById('viewerImage');
  const cap=document.getElementById('viewerCaption');
  if(!img||!item)return;
  img.src=item.url; img.alt=item.title||'Imagen'; img.style.transform=`scale(${viewerScale})`;
  if(cap)cap.textContent=item.description||item.title||'';
  const prev=document.getElementById('viewerPrev'), next=document.getElementById('viewerNext');
  if(prev)prev.classList.toggle('hidden',viewerImages.length<2);
  if(next)next.classList.toggle('hidden',viewerImages.length<2);
  const reset=document.getElementById('zoomReset'); if(reset)reset.textContent=Math.round(viewerScale*100)+'%';
}
function closeImageViewer(){
  const viewer=document.getElementById('imageViewer');
  viewer?.classList.add('hidden'); viewer?.setAttribute('aria-hidden','true');
  document.body.classList.remove('viewer-open');
}
function changeViewer(delta){
  if(viewerImages.length<2)return;
  viewerIndex=(viewerIndex+delta+viewerImages.length)%viewerImages.length;
  viewerScale=1; updateImageViewer();
}
function changeZoom(delta){viewerScale=Math.max(.6,Math.min(3,viewerScale+delta));updateImageViewer();}

document.getElementById('viewerClose')?.addEventListener('click',closeImageViewer);
document.getElementById('viewerPrev')?.addEventListener('click',()=>changeViewer(-1));
document.getElementById('viewerNext')?.addEventListener('click',()=>changeViewer(1));
document.getElementById('zoomIn')?.addEventListener('click',()=>changeZoom(.25));
document.getElementById('zoomOut')?.addEventListener('click',()=>changeZoom(-.25));
document.getElementById('zoomReset')?.addEventListener('click',()=>{viewerScale=1;updateImageViewer()});
document.getElementById('imageViewer')?.addEventListener('click',e=>{if(e.target.id==='imageViewer')closeImageViewer()});
document.getElementById('viewerImage')?.addEventListener('dblclick',()=>{viewerScale=viewerScale>1?1:2;updateImageViewer()});
document.addEventListener('keydown',e=>{if(document.getElementById('imageViewer')?.classList.contains('hidden'))return;if(e.key==='Escape')closeImageViewer();if(e.key==='ArrowLeft')changeViewer(-1);if(e.key==='ArrowRight')changeViewer(1);if(e.key==='+')changeZoom(.25);if(e.key==='-')changeZoom(-.25)});

function closeResult() {
  result.classList.add('hidden');
  result.innerHTML = '';
  lastMatch = null;
  candidateMatch = null;
  candidateHits = 0;
  missHits = 0;
  statusEl.textContent = 'Enfoca una imagen registrada…';
  setDiag(`Cámara activa · ${targets.length} objetivo(s) listo(s).`);
}

function esc(s) { return String(s ?? '').replace(/[&<>'"]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[m])); }
function escAttr(s) { return esc(s); }
function safeUrl(s) { const x = String(s || ''); return /^https?:\/\//i.test(x) ? x : '#'; }

startBtn?.addEventListener('click', start);
stopBtn?.addEventListener('click', stop);
locateBtn?.addEventListener('click', requestUserLocation);
document.getElementById('startNavigation')?.addEventListener('click', activateNavigation);
arrivedBtn?.addEventListener('click', openCameraForDestination);
changeDestinationBtn?.addEventListener('click', ()=>{stop();stopNavigationTracking();cameraPanel?.classList.add('hidden');navigationPanel?.classList.add('hidden');placesPanel?.classList.remove('hidden');renderPlaces();});
backPlacesBtn?.addEventListener('click', ()=>{stop();stopNavigationTracking();navigationPanel?.classList.add('hidden');cameraPanel?.classList.add('hidden');placesPanel?.classList.remove('hidden');renderPlaces();});
window.addEventListener('beforeunload', ()=>{stop();stopNavigationTracking();});
(async function initApp(){
  setDiag('Iniciando AR Turismo…');
  if (placesList) placesList.innerHTML = `<div class="place-loading">🔄 Cargando ${contentPlural.toLowerCase()}…</div>`;
  try {
    const info = await loadBusinesses(false);
    setDiag(`Supabase conectado · ${info.total} ${contentSingular.toLowerCase()}(s) activo(s).`);
    requestUserLocation();
  } catch (e) {
    console.error(`AR Turismo · error al cargar ${contentPlural.toLowerCase()}`, e);
    const message = e?.message || String(e);
    if (placesList) {
      placesList.innerHTML = `
        <div class="place-empty diagnostic-error">
          <strong>❌ No se han podido cargar los ${contentPlural.toLowerCase()}</strong>
          <p>${esc(message)}</p>
          <button type="button" id="retryPlacesBtn" class="secondary">🔄 Reintentar</button>
        </div>`;
      document.getElementById('retryPlacesBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('retryPlacesBtn');
        if (btn) { btn.disabled = true; btn.textContent = '🔄 Intentando…'; }
        try {
          const info = await loadBusinesses(false);
          setDiag(`Supabase conectado · ${info.total} ${contentSingular.toLowerCase()}(s) activo(s).`);
          requestUserLocation();
        } catch (err) {
          console.error('AR Turismo · reintento fallido', err);
          if (placesList) placesList.innerHTML = `<div class="place-empty diagnostic-error"><strong>❌ Sigue sin responder</strong><p>${esc(err?.message || err)}</p><button type="button" id="retryPlacesBtn" class="secondary">🔄 Reintentar</button></div>`;
          document.getElementById('retryPlacesBtn')?.addEventListener('click', () => location.reload());
          setDiag('Error: ' + (err?.message || err));
        }
      });
    }
    setDiag(`Error al cargar ${contentPlural.toLowerCase()}: ` + message);
    if (bootStatus) bootStatus.textContent = '🔴 ' + message;
  }
})();

// v11.2.1: la pantalla inicial muestra únicamente el selector.
// Los contenidos se cargan al elegir cada categoría.
setContentView(null);
