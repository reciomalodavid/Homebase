(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='2';
const CODE_LABELS={
  O_TZ:'Part-time',O_S:'Libre',O_M:'Libre solicitado',O_V:'Libre + vacaciones',O_FLEX:'Libre provisional',O_FIX:'Libre fijo',O_L:'Libre',O_RES:'Reserva → libre',O_SUR:'Libre',O_TX:'Libre bloque 10',O_U:'Libre vacaciones',
  U:'Vacaciones',MED_COCKP:'Medical',MED_OFF:'Medical',KCC_FLD:'Baja médica',KCC_GND:'Baja médica',KCC_OFF:'Baja médica',KCC_SBY:'Baja médica',KCC_VAC:'Baja médica',KCC:'Baja médica',K:'Baja médica',
  STBY:'Standby',STBY_AP:'Standby aeropuerto',STBY_RES:'Reserva',SBY_RS72:'Reserva 72 h',RES_24:'Reserva 24 h',CRM:'CRM',SEP:'SEP',FCL:'FCL Check',OPC:'OPC',REF:'SIM refresher',SIM_APT:'Simulador',SIM_TR:'SIM trainer',SIM_TS:'SIM trainee',TNG_DAY:'Study day',TRAINER:'Training',WETDRILL:'Wet drill',WORKSHOP:'Workshop','1AID':'First Aid'
};

function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function norm(v){return String(v||'').trim().toUpperCase().replace(/[\s-]+/g,'_')}
function labelCode(code){return CODE_LABELS[norm(code)]||String(code||'').replaceAll('_',' ')}
function dateKey(item){return item?.rosterData?.sourceDate||item?.date||''}
function activeRoster(){
  if(typeof state==='undefined'||!Array.isArray(state.items))return[];
  const start=state.rosterMeta?.periodStart||'',end=state.rosterMeta?.periodEnd||'';
  return state.items.filter(item=>{
    if(item?.source!=='roster'||item?.deletedAt)return false;
    const d=dateKey(item);return (!start||d>=start)&&(!end||d<=end);
  });
}
function monthInfo(){
  const start=state?.rosterMeta?.periodStart||activeRoster()[0]?.date||'';
  const [year,month]=String(start).split('-').map(Number);
  if(!year||!month)return null;
  return {year,month,title:new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(year,month-1,1)).replace(/^./,c=>c.toUpperCase())};
}
function kindClass(r){const k=String(r?.kind||'').toLowerCase();return ['flight','dh','standby','off','vacation','training','ground'].includes(k)?k:'other'}
function timeSpan(r,item){
  const start=r.ciLocal||r.startLocal||r.showUpLocal||r.briefingLocal||item.time||'';
  const end=r.coLocal||r.endLocal||r.debriefLocal||item.endTime||'';
  return start?`${start}${end?`–${end}`:''}`:'';
}
function route(r){
  const flights=(r.flights||[]).filter(f=>!f.dh);
  if(!flights.length)return '';
  const points=[flights[0].dep,...flights.map(f=>f.arr)].filter(Boolean);
  return points.join('–');
}
function compactLines(items){
  const lines=[];
  for(const item of items){
    const r=item.rosterData||{},k=String(r.kind||'').toLowerCase(),code=String(r.code||'').replaceAll('_',' '),span=timeSpan(r,item);
    if(k==='flight'||k==='dh'){
      const rt=route(r);
      lines.push({cls:'flight',main:rt||'Vuelo',sub:span||'',hotel:r.hotel?'🌙 Fuera':''});
    }else if(k==='off')lines.push({cls:'off',main:labelCode(code)||'Libre',sub:code&&labelCode(code)!==code?code:'',hotel:''});
    else if(k==='vacation')lines.push({cls:'vacation',main:'Vacaciones',sub:code&&code!=='U'?code:'',hotel:''});
    else if(k==='standby')lines.push({cls:'standby',main:labelCode(code)||'Standby',sub:span,hotel:''});
    else lines.push({cls:kindClass(r),main:labelCode(code)||'Duty',sub:[span,r.airport||r.ciAirport||''].filter(Boolean).join(' · '),hotel:r.hotel?'🌙 Fuera':''});
  }
  return lines.slice(0,3);
}
function calendarCells(items,info){
  const byDate=new Map();
  for(const item of items){const d=dateKey(item);if(!byDate.has(d))byDate.set(d,[]);byDate.get(d).push(item)}
  const first=new Date(info.year,info.month-1,1);const days=new Date(info.year,info.month,0).getDate();
  const mondayIndex=(first.getDay()+6)%7;const total=Math.ceil((mondayIndex+days)/7)*7;let html='';
  for(let i=0;i<total;i++){
    const day=i-mondayIndex+1;
    if(day<1||day>days){html+='<div class="cell empty"></div>';continue}
    const iso=`${info.year}-${String(info.month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const lines=compactLines(byDate.get(iso)||[]);
    html+=`<div class="cell"><div class="num">${day}</div><div class="entries">${lines.map(x=>`<div class="entry ${esc(x.cls)}"><b>${esc(x.main)}</b>${x.sub?`<span>${esc(x.sub)}</span>`:''}${x.hotel?`<em>${esc(x.hotel)}</em>`:''}</div>`).join('')}</div></div>`;
  }
  return html;
}
function buildCalendar(){
  const items=activeRoster(),info=monthInfo();if(!items.length||!info)return '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roster ${esc(info.title)}</title><style>
  @page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}html,body{margin:0;background:#eef2f6;color:#17212b;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.sheet{width:min(1180px,96vw);margin:18px auto;background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(20,35,50,.16);padding:18px}.toolbar{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px}.toolbar button{border:0;border-radius:11px;padding:10px 14px;font-weight:800}.close{background:#eef1f4;color:#273746}.print{background:#5b4db0;color:#fff}.head{display:flex;align-items:end;justify-content:space-between;border-bottom:2px solid #273746;padding-bottom:10px;margin-bottom:10px}.head h1{margin:0;font-size:27px}.head p{margin:3px 0 0;color:#697887;font-size:11px}.legend{font-size:10px;color:#697887;text-align:right}.week{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:5px}.week div{text-align:center;font-size:10px;font-weight:850;text-transform:uppercase;color:#667586}.grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:minmax(94px,1fr);gap:5px}.cell{position:relative;border:1px solid #dce3e9;border-radius:10px;padding:7px 6px 5px;min-width:0;background:#fff}.cell.empty{background:#f5f7f9}.num{font-size:15px;font-weight:900;margin-bottom:5px}.entries{display:grid;gap:4px}.entry{border-radius:7px;padding:4px 5px;line-height:1.08;min-width:0}.entry b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.entry span,.entry em{display:block;font-size:7.5px;margin-top:2px;color:#536271;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.entry.flight,.entry.dh{background:#eaf3fb}.entry.off{background:#eaf7ef}.entry.vacation{background:#fff0dd}.entry.standby{background:#f0ecfb}.entry.training,.entry.ground,.entry.other{background:#f2f3f5}.foot{margin-top:8px;text-align:center;color:#7a8794;font-size:8px}@media(max-width:760px){.sheet{width:1180px;transform-origin:top left}.toolbar{position:sticky;left:0;width:100vw;justify-content:flex-start}.head h1{font-size:24px}}@media print{html,body{background:white}.sheet{width:100%;margin:0;box-shadow:none;border-radius:0;padding:0}.toolbar{display:none}.grid{grid-auto-rows:31mm}.cell{break-inside:avoid}.head{margin-bottom:4mm}.foot{margin-top:3mm}}
  </style></head><body><main class="sheet"><div class="toolbar"><button class="close" onclick="window.close()">Cerrar</button><button class="print" onclick="window.print()">Imprimir / Guardar PDF</button></div><header class="head"><div><h1>Roster · ${esc(info.title)}</h1><p>David · Horarios locales · Vista familiar mensual</p></div><div class="legend">Azul: vuelo · Verde: libre · Naranja: vacaciones · Violeta: standby</div></header><div class="week"><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div></div><section class="grid">${calendarCells(items,info)}</section><div class="foot">Homebase · Documento familiar informativo. El roster oficial sigue siendo el publicado por la compañía.</div></main></body></html>`;
}
function openCalendar(){
  const html=buildCalendar();if(!html){alert('No hay un roster importado para imprimir.');return}
  const win=window.open('','_blank');if(!win){alert('No se pudo abrir el calendario.');return}
  win.document.open();win.document.write(html);win.document.close();
}
function ensureButton(){
  const dialog=document.getElementById('rosterDialog');if(!dialog)return false;
  let btn=document.getElementById('betaPrintRoster');
  if(!btn){btn=document.createElement('button');btn.id='betaPrintRoster';btn.type='button';const anchor=document.getElementById('rosterOptionsPanel');anchor?.parentNode?.insertBefore(btn,anchor)}
  btn.textContent='Calendario imprimible';btn.style.cssText='width:100%;margin:12px 0 4px;padding:12px 14px;border:1px solid rgba(111,88,201,.22);border-radius:14px;background:rgba(111,88,201,.09);color:#57439d;font-weight:850';
  btn.onclick=openCalendar;return true;
}
function install(){if(!ensureButton())setTimeout(install,250)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_PRINT={version:VERSION,open:openCalendar,build:buildCalendar};
})();