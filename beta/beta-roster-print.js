(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';
const CODE_LABELS={
  O_TZ:'Día libre por reducción / part-time',O_S:'Día libre no solicitado',O_M:'Día libre solicitado',O_V:'Día libre antes o después de vacaciones',
  O_FLEX:'Día libre provisional',O_FIX:'Día libre fijo',O_L:'Día libre de planificación a largo plazo',O_RES:'Reserva convertida en día libre',O_SUR:'Día libre cedido voluntariamente',
  O_TX:'Día libre de bloque de 10',O_U:'Día libre asociado a vacaciones',U:'Vacaciones',MED_COCKP:'Reconocimiento médico de cockpit',MED_OFF:'Día libre por reconocimiento médico',
  KCC_FLD:'Baja médica sobre duty de vuelo',KCC_GND:'Baja médica sobre duty de tierra',KCC_OFF:'Baja médica sobre día libre',KCC_SBY:'Baja médica sobre standby',KCC_VAC:'Baja médica sobre vacaciones',KCC:'Baja médica',K:'Baja médica',
  STBY:'Standby',STBY_AP:'Standby en aeropuerto',STBY_RES:'Reserva',SBY_RS72:'Reserva 72 h',RES_24:'Reserva 24 h',
  CRM:'CRM recurrente',SEP:'Safety & Emergency',FCL:'FCL Check',OPC:'OPC',REF:'Simulador refresher',SIM_APT:'Simulador',SIM_TR:'Instructor de simulador',SIM_TS:'Alumno de simulador',TNG_DAY:'Día de estudio',TRAINER:'Formación en tierra',WETDRILL:'Wet drill',WORKSHOP:'Workshop','1AID':'Primeros auxilios'
};

function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function norm(v){return String(v||'').trim().toUpperCase().replace(/[\s-]+/g,'_')}
function codeLabel(code){return CODE_LABELS[norm(code)]||String(code||'').replaceAll('_',' ')}
function localDate(iso){
  if(!iso)return '';
  const [y,m,d]=String(iso).split('-').map(Number);if(!y||!m||!d)return iso;
  return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(new Date(y,m-1,d));
}
function periodTitle(){
  const start=state?.rosterMeta?.periodStart||'';
  if(!start)return 'Roster';
  const [y,m]=start.split('-').map(Number);
  const txt=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));
  return `Roster · ${txt.charAt(0).toUpperCase()+txt.slice(1)}`;
}
function activeRoster(){
  if(typeof state==='undefined'||!Array.isArray(state.items))return[];
  const start=state.rosterMeta?.periodStart||'',end=state.rosterMeta?.periodEnd||'';
  return state.items.filter(item=>{
    if(item?.source!=='roster'||item?.deletedAt)return false;
    const d=item?.rosterData?.sourceDate||item?.date||'';
    return (!start||d>=start)&&(!end||d<=end);
  }).sort((a,b)=>String(a?.rosterData?.sourceDate||a?.date||'').localeCompare(String(b?.rosterData?.sourceDate||b?.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
}
function kindLabel(r){
  const kind=String(r?.kind||'').toLowerCase();
  if(kind==='flight'||kind==='dh')return 'Vuelo';
  if(kind==='standby')return 'Standby / reserva';
  if(kind==='off')return 'Libre';
  if(kind==='vacation')return 'Vacaciones';
  if(kind==='training')return 'Formación';
  if(kind==='ground')return 'Actividad de tierra';
  return 'Roster';
}
function summarize(items){
  const s={flightDays:0,flights:0,standby:0,off:0,vacation:0,other:0,hotels:0};
  for(const item of items){const r=item.rosterData||{},k=String(r.kind||'').toLowerCase();if(k==='flight'||k==='dh'){s.flightDays++;s.flights+=(r.flights||[]).filter(f=>!f.dh).length}else if(k==='standby')s.standby++;else if(k==='off')s.off++;else if(k==='vacation')s.vacation++;else s.other++;if(r.hotel)s.hotels++}
  return s;
}
function flightRows(r){
  return (r.flights||[]).map(f=>`<div class="sector"><b>${esc(f.number||'Vuelo')}</b><span>${esc(f.dep||'')} → ${esc(f.arr||'')}${f.dh?' · DH':''}</span><em>${esc(f.depLocal||'')}${f.arrLocal?`–${esc(f.arrLocal)}`:''}</em></div>`).join('');
}
function activityRows(r){
  return (r.activities||[]).map(a=>`<div class="sector"><b>${esc(String(a.code||'Actividad').replaceAll('_',' '))}</b><span>${esc(a.airport||a.destination||a.arr||'')}</span><em>${esc(a.startLocal||'')}${a.endLocal?`–${esc(a.endLocal)}`:''}</em></div>`).join('');
}
function dutyCard(item){
  const r=item.rosterData||{},code=String(r.code||'').replaceAll('_',' '),kind=String(r.kind||'').toLowerCase();
  const meta=[];
  if(r.pickupLocal)meta.push(`Recogida ${r.pickupLocal}`);
  if(r.briefingLocal)meta.push(`Briefing ${r.briefingLocal}`);
  if(r.ciLocal)meta.push(`C/I ${r.ciLocal}`);
  if(r.coLocal)meta.push(`C/O ${r.coLocal}`);
  if(r.debriefLocal)meta.push(`Debrief ${r.debriefLocal}`);
  const detail=(kind==='flight'||kind==='dh')?flightRows(r):activityRows(r);
  const codeText=code?`${code}${codeLabel(code)&&codeLabel(code)!==code?` · ${codeLabel(code)}`:''}`:'';
  const base=r.ciAirport||r.showUpAirport||r.briefingAirport||r.airport||'';
  return `<article class="duty ${esc(kind||'other')}">
    <div class="day"><strong>${esc(localDate(r.sourceDate||item.date))}</strong><span>${esc(kindLabel(r))}</span></div>
    <div class="body">
      <div class="title">${esc(codeText||kindLabel(r))}</div>
      ${base&&kind!=='flight'?`<div class="sub">Lugar/base: ${esc(base)}</div>`:''}
      ${meta.length?`<div class="times">${meta.map(esc).join(' · ')}</div>`:''}
      ${detail?`<div class="sectors">${detail}</div>`:''}
      ${r.hotel?`<div class="hotel">Noche fuera · ${esc(r.hotel)}</div>`:''}
    </div>
  </article>`;
}
function buildDocument(items){
  const s=summarize(items),title=periodTitle();
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#1d2733;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page{max-width:850px;margin:auto;background:white;min-height:100vh;padding:34px}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;border-bottom:2px solid #28394d;padding-bottom:16px}.top h1{margin:0;font-size:28px}.top p{margin:5px 0 0;color:#687587;font-size:13px}.mark{text-align:right;font-size:11px;color:#687587}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.stat{border:1px solid #dfe5eb;border-radius:12px;padding:10px;text-align:center}.stat b{display:block;font-size:20px}.stat span{font-size:10px;color:#687587}.duties{display:grid;gap:9px}.duty{display:grid;grid-template-columns:155px 1fr;border:1px solid #dfe5eb;border-radius:14px;overflow:hidden;break-inside:avoid}.day{padding:12px;background:#f4f7fa}.day strong{display:block;font-size:13px;text-transform:capitalize}.day span{display:inline-block;margin-top:5px;font-size:10px;font-weight:800;color:#516273;text-transform:uppercase}.body{padding:12px 14px}.title{font-size:14px;font-weight:850}.sub,.times{font-size:11px;color:#617082;margin-top:4px}.sectors{margin-top:8px;border-top:1px solid #edf0f3}.sector{display:grid;grid-template-columns:90px 1fr auto;gap:8px;padding:6px 0;border-bottom:1px solid #edf0f3;font-size:11px}.sector b{font-size:11px}.sector span{font-weight:700}.sector em{font-style:normal;color:#516273;white-space:nowrap}.hotel{margin-top:8px;padding:7px 9px;border-radius:8px;background:#f7f1e7;font-size:11px;font-weight:700}.off .day{background:#eef8f2}.vacation .day{background:#fff5e8}.flight .day,.dh .day{background:#edf4fb}.standby .day{background:#f2effb}.footer{margin-top:18px;padding-top:10px;border-top:1px solid #dfe5eb;font-size:9px;color:#8190a0;text-align:center}@media(max-width:620px){.page{padding:20px}.summary{grid-template-columns:repeat(2,1fr)}.duty{grid-template-columns:118px 1fr}.sector{grid-template-columns:78px 1fr}.sector em{grid-column:2}}@media print{body{background:white}.page{max-width:none;padding:12mm}.duty{page-break-inside:avoid}.no-print{display:none}}
  </style></head><body><main class="page"><header class="top"><div><h1>${esc(title)}</h1><p>Plan mensual de David · horarios mostrados en hora local</p></div><div class="mark">Generado con Homebase Beta</div></header>
  <section class="summary"><div class="stat"><b>${s.flights}</b><span>Vuelos</span></div><div class="stat"><b>${s.flightDays}</b><span>Días de vuelo</span></div><div class="stat"><b>${s.off}</b><span>Días libres</span></div><div class="stat"><b>${s.vacation}</b><span>Vacaciones</span></div><div class="stat"><b>${s.standby}</b><span>Standby</span></div><div class="stat"><b>${s.hotels}</b><span>Noches fuera</span></div><div class="stat"><b>${s.other}</b><span>Otros duties</span></div></section>
  <section class="duties">${items.map(dutyCard).join('')}</section><div class="footer">Documento informativo para uso familiar. El roster operativo oficial sigue siendo el publicado por la compañía.</div></main><script>setTimeout(()=>{window.focus();window.print()},250)<\/script></body></html>`;
}
function printRoster(){
  const items=activeRoster();
  if(!items.length){alert('No hay un roster importado para imprimir.');return}
  const win=window.open('','_blank');
  if(!win){alert('No se pudo abrir la vista de impresión. Permite la ventana emergente e inténtalo de nuevo.');return}
  win.document.open();win.document.write(buildDocument(items));win.document.close();
}
function ensureButton(){
  const dialog=document.getElementById('rosterDialog');if(!dialog)return false;
  let btn=document.getElementById('betaPrintRoster');
  if(btn)return true;
  btn=document.createElement('button');btn.id='betaPrintRoster';btn.type='button';btn.textContent='Imprimir / Guardar PDF';
  btn.style.cssText='width:100%;margin:12px 0 4px;padding:12px 14px;border:1px solid rgba(111,88,201,.22);border-radius:14px;background:rgba(111,88,201,.09);color:#57439d;font-weight:850';
  btn.addEventListener('click',printRoster);
  const anchor=document.getElementById('rosterOptionsPanel');
  anchor?.parentNode?.insertBefore(btn,anchor);
  return true;
}
function install(){if(!ensureButton()){setTimeout(install,250);return}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_PRINT={version:VERSION,print:printRoster,build:()=>buildDocument(activeRoster())};
})();
