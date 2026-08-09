(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='4';
const SIMPLE_LABELS={
  U:'VACACIONES',MED_COCKP:'MEDICAL',MED_OFF:'MEDICAL',KCC_FLD:'BAJA',KCC_GND:'BAJA',KCC_OFF:'BAJA',KCC_SBY:'BAJA',KCC_VAC:'BAJA',KCC:'BAJA',K:'BAJA',
  STBY:'STBY',STBY_AP:'STBY',STBY_RES:'RESERVA',SBY_RS72:'RESERVA 72H',RES_24:'RESERVA 24H',CRM:'CRM',SEP:'SEP',FCL:'FCL CHECK',OPC:'OPC',REF:'SIM',SIM_APT:'SIM',SIM_TR:'SIM',SIM_TS:'SIM',TNG_DAY:'STUDY',TRAINER:'TRAINING',WETDRILL:'WET DRILL',WORKSHOP:'WORKSHOP','1AID':'FIRST AID'
};
const OFF_CODES=/^(?:OFF|O_(?:\+|FIX|FLEX|L|M|NHCA|RES|S|SUR|TX|TZ|U|V))$/;
const AIRPORT_CITY={PAD:'Paderborn',FMO:'Münster',SCN:'Saarbrücken',MUC:'Múnich',PMI:'Palma'};

function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]))}
function norm(v){return String(v||'').trim().toUpperCase().replace(/[\s-]+/g,'_')}
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
function weekCount(info){
  const first=new Date(info.year,info.month-1,1),days=new Date(info.year,info.month,0).getDate();
  const mondayIndex=(first.getDay()+6)%7;
  return Math.ceil((mondayIndex+days)/7);
}
function kindClass(r){const k=String(r?.kind||'').toLowerCase();return ['flight','dh','standby','off','vacation','training','ground'].includes(k)?k:'other'}
function ciCo(r,item){
  const ci=r.ciLocal||r.startLocal||r.showUpLocal||r.briefingLocal||item.time||'';
  const co=r.coLocal||r.endLocal||r.debriefLocal||item.endTime||'';
  return [ci?`C/I ${ci}`:'',co?`C/O ${co}`:''].filter(Boolean).join(' · ');
}
function allFlights(r){return Array.isArray(r.flights)?r.flights:[]}
function routeAll(r){
  const fs=allFlights(r);if(!fs.length)return '';
  const out=[];
  for(const f of fs){if(!out.length&&f.dep)out.push(f.dep);if(f.arr)out.push(f.arr)}
  return out.join('–');
}
function flightNumbers(r){return allFlights(r).map(f=>`${f.number||''}${f.dh?' DH':''}`.trim()).filter(Boolean).join(' · ')}
function nightCity(r){
  const ap=String(r.hotelAirport||'').trim().toUpperCase();
  if(ap)return AIRPORT_CITY[ap]||ap;
  const hotel=String(r.hotel||'').trim();
  if(!hotel)return '';
  for(const [code,city] of Object.entries(AIRPORT_CITY)){if(hotel.toUpperCase().includes(code)||hotel.toLowerCase().includes(city.toLowerCase()))return city}
  const first=hotel.split(/[·,|-]/)[0].trim();
  return first.length<=22?first:'Fuera de base';
}
function simpleDutyLabel(r){
  const code=norm(r.code),kind=String(r.kind||'').toLowerCase();
  if(kind==='off'||OFF_CODES.test(code))return 'OFF';
  if(kind==='vacation'||code==='U')return 'VACACIONES';
  if(kind==='flight'||kind==='dh')return 'VUELO';
  if(kind==='standby')return SIMPLE_LABELS[code]||'STBY';
  return SIMPLE_LABELS[code]||String(r.code||'DUTY').replaceAll('_',' ');
}
function compactLines(items){
  const lines=[];
  for(const item of items){
    const r=item.rosterData||{},k=String(r.kind||'').toLowerCase();
    if(k==='flight'||k==='dh')lines.push({cls:'flight',main:'VUELO',times:ciCo(r,item),route:routeAll(r),flights:flightNumbers(r),night:nightCity(r)});
    else if(k==='off'||OFF_CODES.test(norm(r.code)))lines.push({cls:'off',main:'OFF',times:'',route:'',flights:'',night:''});
    else if(k==='vacation'||norm(r.code)==='U')lines.push({cls:'vacation',main:'VACACIONES',times:'',route:'',flights:'',night:''});
    else{const place=r.airport||r.ciAirport||r.showUpAirport||'';lines.push({cls:kindClass(r),main:simpleDutyLabel(r),times:ciCo(r,item),route:place,flights:'',night:nightCity(r)})}
  }
  return lines.slice(0,3);
}
function calendarCells(items,info){
  const byDate=new Map();
  for(const item of items){const d=dateKey(item);if(!byDate.has(d))byDate.set(d,[]);byDate.get(d).push(item)}
  const first=new Date(info.year,info.month-1,1),days=new Date(info.year,info.month,0).getDate();
  const mondayIndex=(first.getDay()+6)%7,total=Math.ceil((mondayIndex+days)/7)*7;let html='';
  for(let i=0;i<total;i++){
    const day=i-mondayIndex+1;
    if(day<1||day>days){html+='<div class="cell empty"></div>';continue}
    const iso=`${info.year}-${String(info.month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const lines=compactLines(byDate.get(iso)||[]);
    html+=`<div class="cell"><div class="num">${day}</div><div class="entries">${lines.map(x=>`<div class="entry ${esc(x.cls)}"><b>${esc(x.main)}</b>${x.times?`<span class="times">${esc(x.times)}</span>`:''}${x.route?`<span class="route">${esc(x.route)}</span>`:''}${x.flights?`<span class="flights">${esc(x.flights)}</span>`:''}${x.night?`<em>🌙 Noche ${esc(x.night)}</em>`:''}</div>`).join('')}</div></div>`;
  }
  return html;
}
function buildCalendar(){
  const items=activeRoster(),info=monthInfo();if(!items.length||!info)return '';
  const weeks=weekCount(info),printRow=weeks>=6?'24mm':weeks===5?'29mm':'35mm';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roster ${esc(info.title)}</title><style>
  @page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}html,body{margin:0;background:#eef2f6;color:#17212b;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.sheet{width:min(1180px,96vw);margin:18px auto;background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(20,35,50,.16);padding:18px}.toolbar{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px}.toolbar button{border:0;border-radius:11px;padding:10px 14px;font-weight:800}.close{background:#eef1f4;color:#273746}.print{background:#5b4db0;color:#fff}.head{display:flex;align-items:end;justify-content:space-between;border-bottom:2px solid #273746;padding-bottom:10px;margin-bottom:10px}.head h1{margin:0;font-size:27px}.head p{margin:3px 0 0;color:#697887;font-size:11px}.legend{font-size:10px;color:#697887;text-align:right}.week{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:5px}.week div{text-align:center;font-size:10px;font-weight:850;text-transform:uppercase;color:#667586}.grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:minmax(94px,1fr);gap:5px}.cell{position:relative;border:1px solid #dce3e9;border-radius:10px;padding:7px 6px 5px;min-width:0;background:#fff}.cell.empty{background:#f5f7f9}.num{font-size:15px;font-weight:900;margin-bottom:5px}.entries{display:grid;gap:4px}.entry{border-radius:7px;padding:4px 5px;line-height:1.06;min-width:0}.entry b{display:block;font-size:9px;letter-spacing:.2px}.entry span,.entry em{display:block;margin-top:2px;color:#536271;font-style:normal;overflow:hidden;text-overflow:ellipsis}.entry .times{font-size:7.4px;font-weight:750;white-space:nowrap}.entry .route{font-size:7.6px;font-weight:850;white-space:nowrap}.entry .flights{font-size:6.4px;white-space:nowrap}.entry em{font-size:7px;font-weight:850;color:#7a572b;white-space:nowrap}.entry.flight,.entry.dh{background:#eaf3fb}.entry.off{background:#eaf7ef}.entry.vacation{background:#fff0dd}.entry.standby{background:#f0ecfb}.entry.training,.entry.ground,.entry.other{background:#f2f3f5}.foot{margin-top:8px;text-align:center;color:#7a8794;font-size:8px}@media(max-width:760px){.sheet{width:1180px;transform-origin:top left}.toolbar{position:sticky;left:0;width:100vw;justify-content:flex-start}.head h1{font-size:24px}}@media print{html,body{background:white;width:100%;height:100%}.sheet{width:100%;height:auto;margin:0;box-shadow:none;border-radius:0;padding:0}.toolbar{display:none}.head{padding-bottom:2mm;margin-bottom:2mm}.head h1{font-size:18pt}.head p,.legend{font-size:7pt}.week{gap:2mm;margin-bottom:1.5mm}.week div{font-size:7pt}.grid{gap:1.5mm;grid-auto-rows:${printRow}}.cell{padding:1.5mm;border-radius:2mm;break-inside:avoid;overflow:hidden}.num{font-size:10pt;margin-bottom:1mm}.entries{gap:.8mm}.entry{padding:1mm 1.2mm}.entry b{font-size:6.8pt}.entry .times,.entry .route{font-size:5.7pt}.entry .flights,.entry em{font-size:5pt}.foot{margin-top:1.5mm;font-size:5.5pt}}
  </style></head><body><main class="sheet"><div class="toolbar"><button class="close" onclick="window.close()">Cerrar</button><button class="print" onclick="window.print()">Imprimir / Guardar PDF</button></div><header class="head"><div><h1>Roster · ${esc(info.title)}</h1><p>David · Horarios locales · Vista familiar mensual</p></div><div class="legend">Azul: vuelo · Verde: OFF · Naranja: vacaciones · Violeta: standby</div></header><div class="week"><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div></div><section class="grid">${calendarCells(items,info)}</section><div class="foot">Homebase · Documento familiar informativo. El roster oficial sigue siendo el publicado por la compañía.</div></main></body></html>`;
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