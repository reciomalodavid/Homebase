(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';
const MONTHS={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};
const WEEKDAYS={domingo:0,lunes:1,martes:2,miercoles:3,'miércoles':3,jueves:4,viernes:5,sabado:6,'sábado':6};
let parsed=null;
let recognition=null;

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function fold(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function formatDate(v){if(!v)return 'Sin fecha';const [y,m,d]=v.split('-').map(Number);return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date(y,m-1,d))}
function profiles(){
  try{const p=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');if(Array.isArray(p))return p.filter(x=>x?.name).map(x=>x.name)}catch{}
  return [];
}
function profileFromText(text){const f=fold(text);return profiles().find(name=>f.includes(fold(name)))||''}

function parseDate(text){
  const f=fold(text);const now=new Date();now.setHours(12,0,0,0);
  if(/\bpasado manana\b/.test(f)){const d=new Date(now);d.setDate(d.getDate()+2);return iso(d)}
  if(/\bmanana\b/.test(f)){const d=new Date(now);d.setDate(d.getDate()+1);return iso(d)}
  if(/\bhoy\b/.test(f))return iso(now);
  let m=f.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if(m){let y=m[3]?Number(m[3]):now.getFullYear();if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]),12);if(!m[3]&&d<now)d.setFullYear(y+1);return iso(d)}
  m=f.match(/\b(?:el\s+)?(?:dia\s+)?(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?\b/);
  if(m){const y=m[3]?Number(m[3]):now.getFullYear();const d=new Date(y,MONTHS[m[2]],Number(m[1]),12);if(!m[3]&&d<now)d.setFullYear(y+1);return iso(d)}
  for(const [name,index] of Object.entries(WEEKDAYS)){
    if(new RegExp(`\\b${fold(name)}\\b`).test(f)){
      const d=new Date(now);let delta=(index-d.getDay()+7)%7;if(delta===0)delta=7;d.setDate(d.getDate()+delta);return iso(d);
    }
  }
  return '';
}

function normalizeHour(h,m='00'){
  let hour=Number(h),min=Number(m||0);if(hour>23||min>59)return '';
  return `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
function parseTimes(text){
  const f=fold(text);
  let m=f.match(/\bde\s+(?:las\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:h|hrs|horas)?\s+(?:a|hasta)\s+(?:las\s+)?(\d{1,2})(?::(\d{2}))?\b/);
  if(!m)m=f.match(/\b(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\b/);
  if(m)return {start:normalizeHour(m[1],m[2]),end:normalizeHour(m[3],m[4])};
  m=f.match(/\b(?:a\s+las|a\s+la)\s+(\d{1,2})(?::(\d{2}))?\b/);
  if(m)return {start:normalizeHour(m[1],m[2]),end:''};
  return {start:'',end:''};
}

function birthdayName(text){
  const raw=clean(text);
  let m=raw.match(/cumple(?:años|anos)?\s+de\s+(.+?)(?=\s+(?:el|día|dia)\s+\d|\s+\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)|$)/i);
  if(!m)m=raw.match(/cumple(?:años|anos)?\s+(?:para|a)\s+(.+?)(?=\s+(?:el|día|dia)\s+\d|\s+\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)|$)/i);
  if(!m)m=raw.match(/(?:crea|crear|añade|anade|pon)\s+(?:un\s+)?cumple(?:años|anos)?\s+(?:para\s+)?(.+?)(?=\s+(?:el|día|dia)\s+\d|$)/i);
  return clean(m?.[1]||'').replace(/[.,;]+$/,'');
}

function eventTitle(text,type){
  let s=clean(text);
  s=s.replace(/^(?:crea|crear|añade|anade|pon|apunta|agenda|agrega)\s+(?:un|una|el|la)?\s*/i,'');
  if(type==='task')s=s.replace(/^(?:pendiente|recordatorio)\s+(?:de\s+)?/i,'');
  s=s.replace(/\s+\b(?:el\s+)?(?:día|dia)\s+\d{1,2}.*$/i,'');
  s=s.replace(/\s+\bel\s+\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre).*$/i,'');
  s=s.replace(/\s+\b\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre).*$/i,'');
  s=s.replace(/\s+\b(?:hoy|mañana|manana|pasado mañana|pasado manana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b.*$/i,'');
  s=s.replace(/\s+\bde\s+(?:las\s+)?\d{1,2}(?::\d{2})?\s+(?:a|hasta)\s+(?:las\s+)?\d{1,2}(?::\d{2})?.*$/i,'');
  return clean(s)|| (type==='task'?'Pendiente':'Evento');
}

function interpret(text){
  const raw=clean(text),f=fold(raw);if(!raw)return {error:'Dime o escribe qué quieres crear.'};
  const date=parseDate(raw),times=parseTimes(raw),profile=profileFromText(raw);
  if(/\b(cumpleanos|cumple|aniversario)\b/.test(f)){
    const name=birthdayName(raw);
    if(!name)return {error:'He detectado un cumpleaños, pero no el nombre.'};
    if(!date)return {error:'He detectado el cumpleaños, pero no la fecha.'};
    return {type:'birthday',title:`Cumpleaños de ${name}`,name,date,profile};
  }
  const task=/\b(pendiente|recordatorio|recuerdame|acuerdate|tengo que)\b/.test(f);
  const type=task?'task':'event';
  if(!date&&!task)return {error:'No he encontrado la fecha. Prueba, por ejemplo: “cita médica el 12 de septiembre de 10 a 11”.'};
  return {type,title:eventTitle(raw,type),date,start:times.start,end:times.end,profile,category:/\b(medico|medica|doctor|dentista|hospital|pediatra)\b/.test(f)?'Médico':''};
}

function installStyles(){
  if(document.getElementById('betaVoiceAssistantStyles'))return;
  const s=document.createElement('style');s.id='betaVoiceAssistantStyles';s.textContent=`
  #betaVoiceButton{position:fixed;right:82px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:122;width:58px;height:58px;border:0;border-radius:50%;display:grid;place-items:center;background:#6f58c9;color:#fff;box-shadow:0 10px 28px rgba(76,55,150,.28);font-size:25px;touch-action:manipulation}
  #betaVoiceDialog{border:0;padding:0;width:min(92vw,560px);border-radius:26px;background:rgba(252,252,253,.98);box-shadow:0 28px 90px rgba(0,0,0,.28)}
  #betaVoiceDialog::backdrop{background:rgba(25,30,38,.36);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
  .beta-voice-modal{padding:22px;display:grid;gap:15px}.beta-voice-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.beta-voice-head h2{margin:0;font-size:26px}.beta-voice-close{width:40px;height:40px;border:0;border-radius:50%;background:rgba(118,118,128,.12);font-size:25px}
  .beta-voice-copy{margin:-5px 0 0;color:var(--muted);font-size:13px;line-height:1.4}.beta-voice-input{width:100%;min-height:104px;resize:vertical;padding:14px;border:1px solid rgba(60,60,67,.16);border-radius:17px;background:#fff;font-size:17px;line-height:1.4}
  .beta-voice-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.beta-voice-actions button{min-height:50px;border:0;border-radius:15px;font-weight:850;font-size:16px}.beta-voice-listen{background:#eeeafc;color:#5941b1}.beta-voice-interpret{background:#6f58c9;color:#fff}
  #betaVoiceResult{display:none;padding:14px 15px;border-radius:17px;background:#f4f1fb;line-height:1.45}.beta-voice-result-title{font-weight:900;font-size:17px}.beta-voice-result-meta{margin-top:5px;color:#596576;font-size:13px}.beta-voice-error{color:#a33b46;background:#fff0f1!important}
  .beta-voice-create{display:none;min-height:52px;border:0;border-radius:16px;background:var(--accent,#d9781f);color:#fff;font-weight:900;font-size:17px}
  .beta-voice-status{min-height:18px;color:var(--muted);font-size:12px;text-align:center}
  @media(max-width:700px){#betaVoiceDialog{inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important}.beta-voice-modal{min-height:100%;padding:calc(20px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));align-content:start}}
  `;document.head.appendChild(s);
}

function buildDialog(){
  let d=document.getElementById('betaVoiceDialog');if(d)return d;
  d=document.createElement('dialog');d.id='betaVoiceDialog';d.innerHTML=`<div class="beta-voice-modal">
    <div class="beta-voice-head"><h2>Crear por voz</h2><button class="beta-voice-close" type="button" aria-label="Cerrar">×</button></div>
    <p class="beta-voice-copy">Ej.: “Cumpleaños de Juan el 23 de mayo” o “Cita médica el 12 de septiembre de 10 a 11”.</p>
    <textarea class="beta-voice-input" id="betaVoiceInput" placeholder="Habla o escribe aquí…"></textarea>
    <div class="beta-voice-actions"><button class="beta-voice-listen" id="betaVoiceListen" type="button">🎤 Hablar</button><button class="beta-voice-interpret" id="betaVoiceInterpret" type="button">Entender</button></div>
    <div class="beta-voice-status" id="betaVoiceStatus"></div><div id="betaVoiceResult"></div><button class="beta-voice-create" id="betaVoiceCreate" type="button">Crear</button>
  </div>`;
  d.querySelector('.beta-voice-close').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()});
  d.querySelector('#betaVoiceInterpret').addEventListener('click',analyzeInput);d.querySelector('#betaVoiceCreate').addEventListener('click',createParsed);d.querySelector('#betaVoiceListen').addEventListener('click',startListening);
  document.body.appendChild(d);return d;
}

function open(){installStyles();const d=buildDialog();parsed=null;document.getElementById('betaVoiceInput').value='';document.getElementById('betaVoiceResult').style.display='none';document.getElementById('betaVoiceCreate').style.display='none';document.getElementById('betaVoiceStatus').textContent='';d.showModal();}
function resultText(p){
  if(p.type==='birthday')return `<div class="beta-voice-result-title">🎂 ${p.title}</div><div class="beta-voice-result-meta">${formatDate(p.date)}${p.profile?` · ${p.profile}`:''}</div>`;
  const icon=p.type==='task'?'☑️':'📅';const time=p.start?` · ${p.start}${p.end?`–${p.end}`:''}`:'';return `<div class="beta-voice-result-title">${icon} ${p.title}</div><div class="beta-voice-result-meta">${p.date?formatDate(p.date):'Sin fecha'}${time}${p.profile?` · ${p.profile}`:''}</div>`;
}
function analyzeInput(){
  const r=document.getElementById('betaVoiceResult'),c=document.getElementById('betaVoiceCreate');parsed=interpret(document.getElementById('betaVoiceInput').value);
  r.className='';r.style.display='block';if(parsed.error){r.classList.add('beta-voice-error');r.textContent=parsed.error;c.style.display='none';return}
  r.innerHTML=resultText(parsed);c.style.display='block';
}

function startListening(){
  const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;const status=document.getElementById('betaVoiceStatus');
  if(!Ctor){status.textContent='El reconocimiento directo no está disponible aquí. Puedes usar el dictado del teclado.';document.getElementById('betaVoiceInput').focus();return}
  try{
    recognition?.abort?.();recognition=new Ctor();recognition.lang='es-ES';recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>{status.textContent='Escuchando…';document.getElementById('betaVoiceListen').textContent='● Escuchando'};
    recognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';document.getElementById('betaVoiceInput').value=text;status.textContent='';analyzeInput()};
    recognition.onerror=e=>{status.textContent=e.error==='not-allowed'?'Necesito permiso de micrófono. También puedes usar el dictado del teclado.':'No he podido oírlo bien. Prueba otra vez.'};
    recognition.onend=()=>{document.getElementById('betaVoiceListen').textContent='🎤 Hablar'};recognition.start();
  }catch{status.textContent='No he podido activar el micrófono. Usa el dictado del teclado.'}
}

function setPerson(profile){
  if(!profile)return;const picks=[...document.querySelectorAll('#personPicks input[type="checkbox"]')];if(!picks.length)return;for(const p of picks)p.checked=false;const f=fold(profile);const target=picks.find(p=>fold(p.value)===f||fold(p.closest('label')?.textContent)===f||fold(p.parentElement?.textContent)===f);if(target)target.checked=true;
}
function setCategory(label){const sel=document.getElementById('category');if(!sel||!label)return;const f=fold(label);const o=[...sel.options].find(x=>fold(x.textContent)===f);if(o){sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}))}}

function createBirthday(p){
  const api=window.HOMEBASE_BETA_BIRTHDAYS;if(!api?.open)return false;api.open();setTimeout(()=>{
    const name=document.getElementById('betaBirthdayName'),date=document.getElementById('betaBirthdayDate'),profile=document.getElementById('betaBirthdayProfile'),form=document.getElementById('betaBirthdayForm');
    if(name)name.value=p.name;if(date)date.value=p.date;if(profile&&p.profile&&[...profile.options].some(o=>o.value===p.profile))profile.value=p.profile;form?.requestSubmit();
  },60);return true;
}
function createNative(p){
  const api=window.HOMEBASE_BETA_QUICK_ADD;if(!api?.openNativeEditor)return false;const native=document.getElementById('editorDialog');if(native)native.style.visibility='hidden';
  if(!api.openNativeEditor(p.type==='task'?'task':'event')){if(native)native.style.visibility='';return false}
  setTimeout(()=>{
    const form=document.getElementById('editorForm');const title=document.getElementById('titleInput');const startDate=document.getElementById('startDate');const endDate=document.getElementById('endDate');const startTime=document.getElementById('startTime');const endTime=document.getElementById('endTime');const allDay=document.getElementById('allDay');const noDeadline=document.getElementById('noDeadline');
    if(title)title.value=p.title;if(startDate&&p.date)startDate.value=p.date;if(endDate&&p.type==='event'&&p.date)endDate.value=p.date;if(startTime)startTime.value=p.start||'';if(endTime)endTime.value=p.end||'';
    if(p.type==='event'&&!p.start&&allDay&&!allDay.checked)allDay.click();if(p.type==='task'&&!p.date&&noDeadline&&!noDeadline.checked)noDeadline.click();setPerson(p.profile);setCategory(p.category);
    form?.requestSubmit();setTimeout(()=>{if(native)native.style.visibility=''},150);
  },80);return true;
}
function createParsed(){
  if(!parsed||parsed.error)return;const d=document.getElementById('betaVoiceDialog');d?.close();const ok=parsed.type==='birthday'?createBirthday(parsed):createNative(parsed);if(!ok){setTimeout(()=>alert('No he podido abrir el editor de Homebase.'),0)}
}

function install(){installStyles();buildDialog();if(document.getElementById('betaVoiceButton'))return;const b=document.createElement('button');b.id='betaVoiceButton';b.type='button';b.setAttribute('aria-label','Crear por voz');b.title='Crear por voz';b.textContent='🎤';b.addEventListener('click',open);document.body.appendChild(b)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_VOICE_ASSISTANT={version:VERSION,open,interpret};
})();
