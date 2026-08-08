(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='11';
const MONTHS={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};
const WEEKDAYS={domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6};
const WEEKDAY_LABELS={0:'domingo',1:'lunes',2:'martes',3:'miércoles',4:'jueves',5:'viernes',6:'sábado'};
const NUMBER_WORDS={una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuna:21,veintiuno:21,veintidos:22,veintitres:23};
let parsed=null,recognition=null,listening=false,finalTranscript='',hardStopTimer=null,inputTimer=null;

function clean(v){return String(v||'').replace(/\s+/g,' ').replace(/\s+([,.;])/g,'$1').trim()}
function fold(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function escRe(v){return String(v||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function cap(v){const s=clean(v);return s?s.charAt(0).toUpperCase()+s.slice(1):s}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function formatDate(v){if(!v)return 'Sin fecha';const [y,m,d]=v.split('-').map(Number);return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date(y,m-1,d))}
function profiles(){try{const p=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');return Array.isArray(p)?p.filter(x=>x?.name).map(x=>x.name):[]}catch{return []}}

function detectIntent(text){const f=fold(text);if(/\b(cumpleanos|cumple|aniversario)\b/.test(f))return 'birthday';if(/\b(pendiente|recordatorio|recuerdame|acuerdate|tengo que|tarea)\b/.test(f))return 'task';return 'event'}

function profileFromText(text){
  const f=fold(text),names=profiles();
  for(const name of names){if(new RegExp(`\\b${escRe(fold(name))}\\b`,'i').test(f))return {name,confidence:1,matched:fold(name)}}
  const aliasMap={erick:['eric','erik','erick'],elia:['elia','ella']};
  for(const name of names){
    const key=fold(name),aliases=aliasMap[key]||[];
    for(const alias of aliases){
      if(key==='elia'&&alias==='ella'){
        const safe=new RegExp(`(?:^|[,;]\\s*|\\bpara\\s+)${alias}(?=\\s*[,;]|\\s+(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo|hoy|manana|pasado|a\\s+las?|\\d)|$)`,'i');
        if(safe.test(f))return {name,confidence:.78,matched:alias};
      }else if(new RegExp(`\\b${alias}\\b`,'i').test(f))return {name,confidence:.9,matched:alias};
    }
  }
  const self=names.find(n=>fold(n)==='david');
  if(self&&/\b(?:para mi|para que yo|soy david|yo soy david)\b/.test(f))return {name:self,confidence:.85,matched:'self'};
  return {name:'',confidence:0,matched:''};
}

function parseDate(text){
  const f=fold(text),now=new Date();now.setHours(12,0,0,0);
  if(/\bpasado manana\b/.test(f)){const d=new Date(now);d.setDate(d.getDate()+2);return {date:iso(d),matched:'pasado manana'}}
  if(/\bmanana\b/.test(f)){const d=new Date(now);d.setDate(d.getDate()+1);return {date:iso(d),matched:'manana'}}
  if(/\bhoy\b/.test(f))return {date:iso(now),matched:'hoy'};
  let m=f.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if(m){let y=m[3]?Number(m[3]):now.getFullYear();if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]),12);if(!m[3]&&d<now)d.setFullYear(y+1);return {date:iso(d),matched:m[0]}}
  m=f.match(/\b(?:el\s+)?(?:dia\s+)?(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?\b/);
  if(m){const y=m[3]?Number(m[3]):now.getFullYear(),d=new Date(y,MONTHS[m[2]],Number(m[1]),12);if(!m[3]&&d<now)d.setFullYear(y+1);return {date:iso(d),matched:m[0]}}
  const order=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  for(const name of order){if(new RegExp(`\\b${name}\\b`).test(f)){const d=new Date(now),target=WEEKDAYS[name];let delta=(target-d.getDay()+7)%7;if(delta===0)delta=7;d.setDate(d.getDate()+delta);return {date:iso(d),matched:name}}}
  return {date:'',matched:''};
}

function hourValue(token){const t=fold(token);if(/^\d{1,2}$/.test(t))return Number(t);return NUMBER_WORDS[t]??null}
function normalizeHour(hour,min,period){let h=Number(hour),m=Number(min||0);if(h>23||m>59)return '';const p=fold(period);if(/tarde|noche|mediodia/.test(p)&&h<12)h+=12;if(/manana/.test(p)&&h===12)h=0;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
function parseTimes(text){
  const f=fold(text),period='(?:de\\s+la\\s+manana|de\\s+la\\s+tarde|de\\s+la\\s+noche|del\\s+mediodia)',word='(?:una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuna|veintiuno|veintidos|veintitres|\\d{1,2})';
  let m=f.match(new RegExp(`\\b(?:a\\s+las?\\s+)?(${word}):(\\d{2})\\s*(${period})?\\b`));
  if(m){const start=normalizeHour(hourValue(m[1]),m[2],m[3]);return {start,end:'',ambiguous:!m[3]&&hourValue(m[1])<=12,matched:m[0]}}
  m=f.match(new RegExp(`\\b(?:a\\s+las?\\s+)?(${word})(\\s+y\\s+(media|cuarto))?\\s*(${period})\\b`));
  if(m){const min=m[3]==='media'?30:m[3]==='cuarto'?15:0;return {start:normalizeHour(hourValue(m[1]),min,m[4]),end:'',ambiguous:false,matched:m[0]}}
  m=f.match(new RegExp(`\\b(?:a\\s+las?\\s+)?(${word})(\\s+y\\s+(media|cuarto))(?=\\s|,|;|$)`));
  if(m){const min=m[3]==='media'?30:15;return {start:normalizeHour(hourValue(m[1]),min,''),end:'',ambiguous:true,matched:m[0]}}
  m=f.match(/\b(\d{1,2}):(\d{2})\b/);
  if(m){return {start:normalizeHour(m[1],m[2],''),end:'',ambiguous:Number(m[1])<=12,matched:m[0]}}
  return {start:'',end:'',ambiguous:false,matched:''};
}

function parseRepeat(text){const f=fold(text);if(/\b(?:cada dia|todos los dias|diariamente)\b/.test(f))return {frequency:'daily',days:[]};if(/\b(?:cada ano|anualmente)\b/.test(f))return {frequency:'yearly',days:[]};for(const [name,index] of Object.entries(WEEKDAYS)){if(new RegExp(`\\b(?:cada|todos los|todas las)\\s+${name}s?\\b`).test(f))return {frequency:'weekly',days:[index]}}return null}

function stripField(text,matched){if(!matched)return text;return clean(text.replace(new RegExp(escRe(matched),'ig'),' '))}
function stripProfileAliases(text,profile){if(!profile)return text;let s=text;const key=fold(profile),aliases=key==='erick'?['erick','eric','erik']:key==='elia'?['elia','ella']:[profile];for(const a of aliases)s=s.replace(new RegExp(`\\b${escRe(a)}\\b`,'ig'),' ');return clean(s)}
function normalizeVerb(s){let v=clean(s).replace(/^(?:que\s+)?(?:yo|el|ella)\s+/i,'');const rules=[[/^se\s+lave\b/i,'lavarse'],[/^se\s+cepille\b/i,'cepillarse'],[/^se\s+duche\b/i,'ducharse'],[/^se\s+vista\b/i,'vestirse'],[/^vaya\b/i,'ir'],[/^voy\b/i,'ir'],[/^vamos\b/i,'ir'],[/^limpie\b/i,'limpiar'],[/^recoja\b/i,'recoger'],[/^ordene\b/i,'ordenar'],[/^saque\b/i,'sacar'],[/^haga\b/i,'hacer']];for(const [re,to] of rules){if(re.test(v)){v=v.replace(re,to);break}}return clean(v)}
function extractAction(text,intent,profile,dateInfo,timeInfo){
  let s=clean(text);
  s=stripField(s,dateInfo.matched);s=stripField(s,timeInfo.matched);s=stripProfileAliases(s,profile);
  s=s.replace(/\b(?:cada|todos\s+los|todas\s+las)\s+(?:lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|dias?|anos?)\b/ig,' ');
  s=s.replace(/^(?:crea|crear|haz|hazme|anade|añade|pon|apunta|agenda|agrega|quiero|necesito)\s+(?:un|una|el|la)?\s*/i,'');
  s=s.replace(/^(?:evento|cita|tarea\s+pendiente|tarea|pendiente|recordatorio)\s*(?:de|para)?\s*/i,'');
  s=s.replace(/\b(?:para\s+mi|soy\s+david|yo\s+soy\s+david)\b/ig,' ');
  s=s.replace(/^(?:para\s+que|que|para|de)\s+/i,'');
  s=s.replace(/^[,;.:\-\s]+|[,;.:\-\s]+$/g,'');
  s=normalizeVerb(s);
  if(intent==='task')s=s.replace(/^que\s+/i,'');
  const words=clean(s).split(' ').filter(Boolean);if(words.length>7)s=words.slice(0,7).join(' ');
  return cap(s);
}
function extractBirthdayName(text,dateInfo,profile){let s=stripField(text,dateInfo.matched);s=stripProfileAliases(s,profile);s=s.replace(/^(?:crea|crear|anade|añade|pon|apunta)\s+(?:un|una)?\s*/i,'').replace(/^(?:cumpleanos|cumpleaños|cumple|aniversario)\s*(?:de|para|a)?\s*/i,'');return cap(clean(s).replace(/^[,;.:\-\s]+|[,;.:\-\s]+$/g,''))}

function questionFor(p){if(p.type==='birthday'){if(!p.name)return '¿De quién es el cumpleaños?';if(!p.date)return '¿Qué día es el cumpleaños?';return ''}if(!p.title)return '¿Qué quieres apuntar?';if(p.type==='event'&&!p.date)return '¿Qué día es?';if(p.timeAmbiguous&&p.start)return `¿${p.start} es de la mañana o de la tarde?`;return ''}
function interpret(text){
  const raw=clean(text);if(!raw)return {error:'Dime o escribe qué quieres crear.'};
  const type=detectIntent(raw),profileInfo=profileFromText(raw),dateInfo=parseDate(raw),timeInfo=parseTimes(raw),repeat=parseRepeat(raw);
  if(type==='birthday'){const name=extractBirthdayName(raw,dateInfo,profileInfo.name),p={type,title:name?`Cumpleaños de ${name}`:'',name,date:dateInfo.date,profile:profileInfo.name,repeat:{frequency:'yearly',days:[]}};p.question=questionFor(p);return p}
  const title=extractAction(raw,type,profileInfo.name,dateInfo,timeInfo),p={type,title,date:dateInfo.date,start:timeInfo.start,end:timeInfo.end,timeAmbiguous:timeInfo.ambiguous,profile:profileInfo.name,repeat,category:/\b(medico|medica|doctor|dentista|hospital|pediatra)\b/.test(fold(raw))?'Médico':''};p.question=questionFor(p);return p;
}

function installStyles(){if(document.getElementById('betaVoiceAssistantStyles'))return;const s=document.createElement('style');s.id='betaVoiceAssistantStyles';s.textContent=`#betaVoiceDialog{border:0;padding:0;width:min(92vw,560px);border-radius:26px;background:rgba(252,252,253,.98);box-shadow:0 28px 90px rgba(0,0,0,.28)}#betaVoiceDialog::backdrop{background:rgba(25,30,38,.36);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}.beta-voice-modal{padding:22px;display:grid;gap:15px}.beta-voice-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.beta-voice-head h2{margin:0;font-size:26px}.beta-voice-close{width:40px;height:40px;border:0;border-radius:50%;background:rgba(118,118,128,.12);font-size:25px}.beta-voice-copy{margin:-5px 0 0;color:var(--muted);font-size:13px;line-height:1.4}.beta-voice-input{width:100%;min-height:104px;resize:vertical;padding:14px;border:1px solid rgba(60,60,67,.16);border-radius:17px;background:#fff;font-size:17px;line-height:1.4}.beta-voice-listen{min-height:52px;border:0;border-radius:15px;font-weight:850;font-size:17px;background:#eeeafc;color:#5941b1}.beta-voice-listen.listening{background:#f8e8ea;color:#b33b4a}#betaVoiceResult{display:none;padding:14px 15px;border-radius:17px;background:#f4f1fb;line-height:1.45}.beta-voice-result-title{font-weight:900;font-size:17px}.beta-voice-result-meta{margin-top:5px;color:#596576;font-size:13px}.beta-voice-question{margin-top:9px;font-weight:800;color:#7a4d00}.beta-voice-error{color:#a33b46;background:#fff0f1!important}.beta-voice-create{display:none;min-height:52px;border:0;border-radius:16px;background:var(--accent,#d9781f);color:#fff;font-weight:900;font-size:17px}.beta-voice-status{min-height:18px;color:var(--muted);font-size:12px;text-align:center}@media(max-width:700px){#betaVoiceDialog{inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important}.beta-voice-modal{min-height:100%;padding:calc(20px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));align-content:start}}`;document.head.appendChild(s)}
function buildDialog(){let d=document.getElementById('betaVoiceDialog');if(d)return d;d=document.createElement('dialog');d.id='betaVoiceDialog';d.innerHTML=`<div class="beta-voice-modal"><div class="beta-voice-head"><h2>Crear por voz</h2><button class="beta-voice-close" type="button" aria-label="Cerrar">×</button></div><p class="beta-voice-copy">Di persona, día, hora y acción en el orden que quieras.</p><textarea class="beta-voice-input" id="betaVoiceInput" placeholder="Ej.: Elia, lunes, nueve de la mañana, ir al cole"></textarea><button class="beta-voice-listen" id="betaVoiceListen" type="button">🎤 Hablar</button><div class="beta-voice-status" id="betaVoiceStatus"></div><div id="betaVoiceResult"></div><button class="beta-voice-create" id="betaVoiceCreate" type="button">Crear</button></div>`;d.querySelector('.beta-voice-close').addEventListener('click',()=>{stopListening();d.close()});d.addEventListener('click',e=>{if(e.target===d){stopListening();d.close()}});d.querySelector('#betaVoiceCreate').addEventListener('click',createParsed);d.querySelector('#betaVoiceListen').addEventListener('click',toggleListening);d.querySelector('#betaVoiceInput').addEventListener('input',()=>{clearTimeout(inputTimer);inputTimer=setTimeout(()=>analyzeInput(true),120)});document.body.appendChild(d);return d}
function open(){installStyles();const d=buildDialog();stopListening();parsed=null;finalTranscript='';document.getElementById('betaVoiceInput').value='';document.getElementById('betaVoiceResult').style.display='none';document.getElementById('betaVoiceCreate').style.display='none';document.getElementById('betaVoiceStatus').textContent='';d.showModal()}
function repeatLabel(r){if(!r)return '';if(r.frequency==='daily')return ' · Cada día';if(r.frequency==='yearly')return ' · Anual';if(r.frequency==='weekly')return ` · Cada ${WEEKDAY_LABELS[r.days[0]]}`;return ''}
function resultText(p){if(p.type==='birthday'){const q=p.question?`<div class="beta-voice-question">${p.question}</div>`:'';return `<div class="beta-voice-result-title">🎂 ${p.title||'Cumpleaños'}</div><div class="beta-voice-result-meta">${p.date?formatDate(p.date):'Sin fecha'}${p.profile?` · ${p.profile}`:''} · Anual</div>${q}`}const icon=p.type==='task'?'☑️':'📅',time=p.start?` · ${p.start}${p.end?`–${p.end}`:''}`:'',q=p.question?`<div class="beta-voice-question">${p.question}</div>`:'';return `<div class="beta-voice-result-title">${icon} ${p.title||'Sin título'}</div><div class="beta-voice-result-meta">${p.date?formatDate(p.date):'Sin fecha'}${time}${p.profile?` · ${p.profile}`:' · Familia'}${repeatLabel(p.repeat)}</div>${q}`}
function analyzeInput(quiet=false){const input=document.getElementById('betaVoiceInput'),r=document.getElementById('betaVoiceResult'),c=document.getElementById('betaVoiceCreate');parsed=interpret(input?.value||'');r.className='';if(parsed.error){if(quiet){r.style.display='none';c.style.display='none';return}r.style.display='block';r.classList.add('beta-voice-error');r.textContent=parsed.error;c.style.display='none';return}r.style.display='block';r.innerHTML=resultText(parsed);c.style.display=parsed.question?'none':'block'}
function setListeningUi(on){listening=on;const b=document.getElementById('betaVoiceListen'),s=document.getElementById('betaVoiceStatus');if(b){b.textContent=on?'■ Parar':'🎤 Hablar';b.classList.toggle('listening',on)}if(s)s.textContent=on?'Escuchando…':''}
function stopListening(){clearTimeout(hardStopTimer);hardStopTimer=null;if(recognition&&listening){try{recognition.stop()}catch{}}setListeningUi(false)}
function toggleListening(){listening?stopListening():startListening()}
function startListening(){const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition,status=document.getElementById('betaVoiceStatus'),input=document.getElementById('betaVoiceInput');if(!Ctor){status.textContent='El reconocimiento directo no está disponible aquí. Puedes usar el dictado del teclado.';input.focus();return}try{recognition?.abort?.();finalTranscript='';recognition=new Ctor();recognition.lang='es-ES';recognition.interimResults=true;recognition.continuous=false;recognition.maxAlternatives=1;recognition.onstart=()=>{setListeningUi(true);hardStopTimer=setTimeout(stopListening,15000)};recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalTranscript+=t+' ';else interim+=t}input.value=clean(finalTranscript+interim);analyzeInput(true)};recognition.onerror=e=>{setListeningUi(false);status.textContent=e.error==='not-allowed'?'Necesito permiso de micrófono. También puedes usar el dictado del teclado.':'No he podido oírlo bien. Prueba otra vez.'};recognition.onend=()=>{clearTimeout(hardStopTimer);setListeningUi(false);analyzeInput(false)};recognition.start()}catch{status.textContent='No he podido activar el micrófono. Usa el dictado del teclado.';setListeningUi(false)}}
function setPerson(profile){if(!profile)return;const picks=[...document.querySelectorAll('#personPicks input[type="checkbox"]')];if(!picks.length)return;for(const p of picks)p.checked=false;const f=fold(profile),target=picks.find(p=>fold(p.value)===f||fold(p.closest('label')?.textContent)===f||fold(p.parentElement?.textContent)===f);if(target)target.checked=true}
function setCategory(label){const sel=document.getElementById('category');if(!sel||!label)return;const f=fold(label),o=[...sel.options].find(x=>fold(x.textContent)===f);if(o){sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}))}}
function setRepeat(repeat){if(!repeat?.frequency)return;const more=document.getElementById('moreOptions'),advanced=document.getElementById('advanced');if(more&&advanced&&!advanced.classList.contains('open'))more.click();const sel=document.getElementById('repeat');if(sel){sel.value=repeat.frequency;sel.dispatchEvent(new Event('change',{bubbles:true}))}if(repeat.frequency==='weekly'){const days=[...document.querySelectorAll('input[name="repeatDay"]')];for(const input of days)input.checked=repeat.days.includes(Number(input.value))}}
function createBirthday(p){const api=window.HOMEBASE_BETA_BIRTHDAYS;if(!api?.open)return false;api.open();setTimeout(()=>{const name=document.getElementById('betaBirthdayName'),date=document.getElementById('betaBirthdayDate'),profile=document.getElementById('betaBirthdayProfile'),form=document.getElementById('betaBirthdayForm');if(name)name.value=p.name;if(date)date.value=p.date;if(profile&&p.profile&&[...profile.options].some(o=>o.value===p.profile))profile.value=p.profile;form?.requestSubmit()},60);return true}
function createNative(p){const api=window.HOMEBASE_BETA_QUICK_ADD;if(!api?.openNativeEditor)return false;const native=document.getElementById('editorDialog');if(native)native.style.visibility='hidden';if(!api.openNativeEditor(p.type==='task'?'task':'event')){if(native)native.style.visibility='';return false}setTimeout(()=>{const form=document.getElementById('editorForm'),title=document.getElementById('titleInput'),startDate=document.getElementById('startDate'),endDate=document.getElementById('endDate'),startTime=document.getElementById('startTime'),endTime=document.getElementById('endTime'),allDay=document.getElementById('allDay'),noDeadline=document.getElementById('noDeadline');if(title)title.value=p.title;if(startDate&&p.date)startDate.value=p.date;if(endDate&&p.type==='event'&&p.date)endDate.value=p.date;if(startTime)startTime.value=p.start||'';if(endTime)endTime.value=p.end||'';if(p.type==='event'&&!p.start&&allDay&&!allDay.checked)allDay.click();if(p.type==='task'&&!p.date&&noDeadline&&!noDeadline.checked)noDeadline.click();setPerson(p.profile);setCategory(p.category);if(p.type==='event')setRepeat(p.repeat);form?.requestSubmit();setTimeout(()=>{if(native)native.style.visibility=''},150)},80);return true}
function createParsed(){if(!parsed||parsed.error||parsed.question)return;stopListening();const d=document.getElementById('betaVoiceDialog');d?.close();const ok=parsed.type==='birthday'?createBirthday(parsed):createNative(parsed);if(!ok)setTimeout(()=>alert('No he podido abrir el editor de Homebase.'),0)}
function install(){installStyles();buildDialog()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_VOICE_ASSISTANT={version:VERSION,open,interpret};
})();