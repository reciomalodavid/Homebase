(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';
let selectedMonth='';
let selectedMode='combined';
let showPending=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?new Date(`${s}T12:00:00`):null;
const monthKey=s=>/^\d{4}-\d{2}/.test(String(s||''))?String(s).slice(0,7):'';
const monthInfo=key=>{const [year,month]=String(key||'').split('-').map(Number);if(!year||!month)return null;return{year,month,key,title:new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(year,month-1,1)).replace(/^./,c=>c.toUpperCase())}};
const people=item=>Array.isArray(item?.people)&&item.people.length?item.people:[item?.person||'Familia'];
const profileColor=name=>{try{const ps=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');return ps.find(p=>p.name===name)?.color||'#3a7be0'}catch{return'#3a7be0'}};
const itemColor=item=>item?.eventColor||profileColor(people(item)[0]);

function items(){return typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]}
function activeItems(){return items().filter(x=>!x.deletedAt)}
function allRoster(){return activeItems().filter(x=>x.source==='roster')}
function allFamilyEvents(){return activeItems().filter(x=>x.type==='event'&&x.source!=='roster')}
function allTasks(){return activeItems().filter(x=>x.type==='task'&&!x.done)}
function expiries(){try{const v=JSON.parse(localStorage.getItem('homebase_expiries_v2')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}

function occursOn(item,date){
 const key=isoDate(date),start=parseDate(item.date);
 if(!start||date<start)return false;
 if(item.repeatUntil&&key>item.repeatUntil)return false;
 if(Array.isArray(item.exceptions)&&item.exceptions.includes(key))return false;
 if(item.repeat==='weekly'){
   const days=Array.isArray(item.repeatDays)&&item.repeatDays.length?item.repeatDays:[start.getDay()];
   return days.includes(date.getDay());
 }
 if(item.repeat==='monthly')return date.getDate()===start.getDate();
 if(item.repeat==='yearly')return date.getDate()===start.getDate()&&date.getMonth()===start.getMonth();
 const end=parseDate(item.endDate||item.date)||start;
 return date>=start&&date<=end;
}

function eventLinesForDay(date){
 return allFamilyEvents().filter(item=>occursOn(item,date)).map(item=>({
   cls:'family',title:item.title||'Evento',meta:item.allDay?'Todo el día':([item.time,item.endTime].filter(Boolean).join('–')||''),color:itemColor(item)
 }));
}

function rosterDate(item){return item?.rosterData?.sourceDate||item?.date||''}
function rosterLabel(item){
 const r=item.rosterData||{},kind=String(r.kind||'').toLowerCase(),code=String(r.code||'').toUpperCase();
 if(kind==='off'||code.startsWith('O_')||code==='OFF')return{title:'OFF',cls:'off'};
 if(kind==='vacation'||code==='U')return{title:'VACACIONES',cls:'vacation'};
 if(kind==='standby'||code.startsWith('STBY')||code.startsWith('SBY'))return{title:code.includes('RS72')?'RESERVA 72H':code.includes('RES')?'RESERVA':'STBY',cls:'standby'};
 if(kind==='flight'||kind==='dh'){
   const flights=Array.isArray(r.flights)?r.flights:[];const route=[];
   for(const f of flights){if(!route.length&&f.dep)route.push(f.dep);if(f.arr)route.push(f.arr)}
   const ci=r.ciLocal||r.startLocal||r.showUpLocal||item.time||'',co=r.coLocal||r.endLocal||r.debriefLocal||item.endTime||'';
   return{title:'VUELO',meta:[ci&&`C/I ${ci}`,co&&`C/O ${co}`,route.join('–')].filter(Boolean).join(' · '),cls:'flight'};
 }
 return{title:(code||'DUTY').replaceAll('_',' '),meta:r.airport||r.ciAirport||'',cls:'duty'};
}
function rosterLinesForDay(key){return allRoster().filter(item=>rosterDate(item)===key).map(item=>rosterLabel(item))}
function expiryLinesForDay(key){return expiries().filter(x=>x.expiryDate===key).map(x=>({title:`⏳ ${x.title||'Vencimiento'}`,meta:x.profileName||'',cls:'expiry'}))}

function availableMonths(){
 const set=new Set();
 activeItems().forEach(item=>{const d=item.source==='roster'?rosterDate(item):item.date;if(monthKey(d))set.add(monthKey(d));if(monthKey(item.endDate))set.add(monthKey(item.endDate))});
 expiries().forEach(x=>{if(monthKey(x.expiryDate))set.add(monthKey(x.expiryDate))});
 const now=new Date();set.add(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
 return [...set].sort().reverse();
}
function currentMonth(){const months=availableMonths();if(selectedMonth&&months.includes(selectedMonth))return selectedMonth;const d=typeof state!=='undefined'&&state.month instanceof Date?state.month:new Date();const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return months.includes(k)?k:(months[0]||k)}

function pendingForMonth(key){return allTasks().filter(t=>monthKey(t.date)===key).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'').localeCompare(b.time||''))}
function weekCount(info){const first=new Date(info.year,info.month-1,1),days=new Date(info.year,info.month,0).getDate(),offset=(first.getDay()+6)%7;return Math.ceil((offset+days)/7)}

function dayLines(date,mode){
 const key=isoDate(date),out=[];
 if(mode!=='roster')out.push(...eventLinesForDay(date));
 if(mode!=='calendar')out.push(...rosterLinesForDay(key));
 out.push(...expiryLinesForDay(key));
 return out.slice(0,5);
}
function cells(info,mode){
 const first=new Date(info.year,info.month-1,1),days=new Date(info.year,info.month,0).getDate(),offset=(first.getDay()+6)%7,total=Math.ceil((offset+days)/7)*7;let html='';
 for(let i=0;i<total;i++){
   const day=i-offset+1;if(day<1||day>days){html+='<div class="hcp-cell hcp-empty"></div>';continue}
   const date=new Date(info.year,info.month-1,day),lines=dayLines(date,mode);
   html+=`<div class="hcp-cell"><div class="hcp-num">${day}</div><div class="hcp-lines">${lines.map(x=>`<div class="hcp-line ${esc(x.cls||'family')}" ${x.color?`style="--item:${esc(x.color)}"`:''}><b>${esc(x.title)}</b>${x.meta?`<span>${esc(x.meta)}</span>`:''}</div>`).join('')}</div></div>`;
 }
 return html;
}
function pendingHtml(key){const list=pendingForMonth(key);return `<aside class="hcp-pending"><h2>Pendientes</h2>${list.length?`<div class="hcp-pending-list">${list.map(t=>`<div class="hcp-task"><b>${esc(t.title||'Pendiente')}</b><span>${t.date?esc(new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(parseDate(t.date))):'Sin fecha'}${people(t).length?` · ${esc(people(t).join(', '))}`:''}</span></div>`).join('')}</div>`:'<p>Sin tareas pendientes este mes.</p>'}</aside>`}
function modeTitle(mode){return mode==='roster'?'Roster':mode==='calendar'?'Calendario familiar':'Calendario + roster'}
function sheet(key,mode,pending){const info=monthInfo(key);if(!info)return'';const weeks=weekCount(info);return `<section class="hcp-sheet ${pending?'with-pending':'full'}" style="--weeks:${weeks}"><header class="hcp-head"><div><h1>${esc(modeTitle(mode))} · ${esc(info.title)}</h1><p>Homebase · Vista mensual · Vencimientos incluidos automáticamente</p></div><div class="hcp-legend">Eventos familiares · Roster · ⏳ Vencimientos</div></header><div class="hcp-layout"><main class="hcp-calendar"><div class="hcp-week"><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div></div><div class="hcp-grid">${cells(info,mode)}</div></main>${pending?pendingHtml(key):''}</div></section>`}

const CSS=`*{box-sizing:border-box}html,body{margin:0;background:#eef2f6;color:#17212b;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hcp-sheet{width:min(1280px,97vw);margin:0 auto;background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(20,35,50,.16);padding:18px}.hcp-head{display:flex;align-items:end;justify-content:space-between;border-bottom:2px solid #273746;padding-bottom:10px;margin-bottom:10px}.hcp-head h1{margin:0;font-size:25px}.hcp-head p,.hcp-legend{font-size:10px;color:#697887}.hcp-head p{margin:3px 0 0}.hcp-layout{display:grid;grid-template-columns:1fr;gap:10px}.hcp-sheet.with-pending .hcp-layout{grid-template-columns:minmax(0,4fr) minmax(150px,1fr)}.hcp-week,.hcp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.hcp-week{margin-bottom:5px}.hcp-week div{text-align:center;font-size:10px;font-weight:850;color:#667586;text-transform:uppercase}.hcp-grid{grid-template-rows:repeat(var(--weeks),minmax(95px,1fr))}.hcp-cell{border:1px solid #dce3e9;border-radius:10px;padding:6px;overflow:hidden;background:#fff;min-width:0}.hcp-empty{background:#f5f7f9}.hcp-num{font-size:15px;font-weight:900;margin-bottom:4px}.hcp-lines{display:grid;gap:3px}.hcp-line{border-radius:6px;padding:3px 4px;line-height:1.08;min-width:0}.hcp-line b{display:block;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hcp-line span{display:block;font-size:6.8px;color:#536271;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hcp-line.family{background:color-mix(in srgb,var(--item,#3a7be0) 14%,white);border-left:3px solid var(--item,#3a7be0)}.hcp-line.flight{background:#eaf3fb}.hcp-line.off{background:#eaf7ef}.hcp-line.vacation{background:#fff0dd}.hcp-line.standby{background:#f0ecfb}.hcp-line.duty{background:#f2f3f5}.hcp-line.expiry{background:#fff5db;border-left:3px solid #c88a16}.hcp-pending{border-left:1px solid #dce3e9;padding-left:10px}.hcp-pending h2{font-size:15px;margin:0 0 8px}.hcp-pending p{font-size:9px;color:#697887}.hcp-pending-list{display:grid;gap:6px}.hcp-task{padding:7px;border-radius:8px;background:#f5f7f9}.hcp-task b{display:block;font-size:8px}.hcp-task span{display:block;margin-top:2px;font-size:6.8px;color:#697887}@page{size:A4 landscape;margin:5mm}@media print{html,body{background:#fff;width:100%;height:100%;overflow:hidden}.hcp-sheet{width:100%;height:190mm;max-height:190mm;margin:0;padding:0;border-radius:0;box-shadow:none;display:grid;grid-template-rows:auto 1fr;overflow:hidden}.hcp-head{padding:0 0 1.5mm;margin:0 0 1.5mm;min-height:11mm}.hcp-head h1{font-size:15pt}.hcp-head p,.hcp-legend{font-size:6pt}.hcp-layout{height:176mm;gap:1.5mm}.hcp-sheet.with-pending .hcp-layout{grid-template-columns:4fr 1fr}.hcp-calendar{min-width:0;display:grid;grid-template-rows:auto 1fr}.hcp-week{gap:1mm;margin:0 0 1mm}.hcp-week div{font-size:6.3pt}.hcp-grid{height:164mm;min-height:0;gap:1mm;grid-template-rows:repeat(var(--weeks),1fr)}.hcp-cell{min-height:0;padding:1mm;border-radius:1.3mm}.hcp-num{font-size:8.5pt;margin-bottom:.5mm}.hcp-lines{gap:.45mm}.hcp-line{padding:.55mm .7mm}.hcp-line b{font-size:5.7pt}.hcp-line span{font-size:4.6pt}.hcp-pending{padding-left:1.5mm}.hcp-pending h2{font-size:8pt;margin-bottom:1.2mm}.hcp-pending-list{gap:.8mm}.hcp-task{padding:1mm}.hcp-task b{font-size:5.3pt}.hcp-task span{font-size:4.4pt}}`;

function documentHtml(key,mode,pending){return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>${sheet(key,mode,pending)}</body></html>`}
function installStyles(){if(document.getElementById('homebaseCalendarPrintStyles'))return;const s=document.createElement('style');s.id='homebaseCalendarPrintStyles';s.textContent=`#homebaseCalendarPrintOverlay[hidden]{display:none!important}#homebaseCalendarPrintOverlay{position:fixed;inset:0;z-index:5100;background:#eef2f6;overflow:auto;padding:14px}.hcp-toolbar{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:minmax(150px,1fr) minmax(160px,1fr) auto auto auto;gap:8px;align-items:end;padding:10px;margin:0 auto 12px;max-width:1100px;background:rgba(255,255,255,.96);border-radius:16px;box-shadow:0 8px 28px rgba(20,35,50,.13)}.hcp-toolbar label{margin:0;font-size:10px;color:#667586}.hcp-toolbar select{margin-top:4px;padding:10px}.hcp-toggle{display:flex!important;align-items:center;gap:7px;min-height:42px;margin:0!important;padding:0 8px;font-size:11px!important}.hcp-toggle input{width:auto}.hcp-toolbar button{border:0;border-radius:11px;padding:11px 14px;font-weight:850;white-space:nowrap}.hcp-close{background:#e4e8ec;color:#273746}.hcp-print{background:#493991;color:#fff}.hcp-entry-section{margin-top:14px}.hcp-entry-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-radius:18px;background:linear-gradient(135deg,rgba(111,88,201,.11),rgba(58,123,224,.08));border:1px solid rgba(111,88,201,.18)}.hcp-entry-card strong{display:block;font-size:15px}.hcp-entry-card small{display:block;margin-top:3px;color:#687587;font-size:11px}.hcp-entry-card button{border:0;border-radius:12px;background:#5f4bb4;color:#fff;padding:11px 14px;font-weight:850}@media(max-width:700px){.hcp-toolbar{grid-template-columns:1fr 1fr}.hcp-toolbar .hcp-toggle{grid-column:1/-1}.hcp-toolbar button{width:100%}}${CSS}`;document.head.appendChild(s)}
function ensureOverlay(){let o=document.getElementById('homebaseCalendarPrintOverlay');if(o)return o;o=document.createElement('div');o.id='homebaseCalendarPrintOverlay';o.hidden=true;o.innerHTML=`<div class="hcp-toolbar"><label>Mes<select id="hcpMonth"></select></label><label>Contenido<select id="hcpMode"><option value="combined">Calendario + roster</option><option value="calendar">Solo calendario</option><option value="roster">Solo roster</option></select></label><label class="hcp-toggle"><input id="hcpPending" type="checkbox"> Mostrar pendientes</label><button type="button" class="hcp-close">Cerrar</button><button type="button" class="hcp-print">Imprimir / Guardar PDF</button></div><div class="hcp-preview"></div><iframe class="hcp-frame" title="Calendario para imprimir" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0"></iframe>`;document.body.appendChild(o);o.querySelector('.hcp-close').onclick=close;o.querySelector('.hcp-print').onclick=print;o.querySelector('#hcpMonth').onchange=e=>{selectedMonth=e.target.value;refresh()};o.querySelector('#hcpMode').onchange=e=>{selectedMode=e.target.value;refresh()};o.querySelector('#hcpPending').onchange=e=>{showPending=e.target.checked;refresh()};return o}
function prepareFrame(o){const f=o.querySelector('.hcp-frame'),b=o.querySelector('.hcp-print');b.disabled=true;f.onload=()=>{b.disabled=false};f.srcdoc=documentHtml(selectedMonth||currentMonth(),selectedMode,showPending)}
function refresh(){const o=ensureOverlay(),key=selectedMonth||currentMonth();o.querySelector('.hcp-preview').innerHTML=sheet(key,selectedMode,showPending);prepareFrame(o)}
function open(){installStyles();const o=ensureOverlay(),months=availableMonths();selectedMonth=currentMonth();const sel=o.querySelector('#hcpMonth');sel.innerHTML=months.map(m=>`<option value="${esc(m)}">${esc(monthInfo(m)?.title||m)}</option>`).join('');sel.value=selectedMonth;o.querySelector('#hcpMode').value=selectedMode;o.querySelector('#hcpPending').checked=showPending;refresh();document.body.dataset.hcpOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';o.hidden=false;o.scrollTop=0}
function close(){const o=document.getElementById('homebaseCalendarPrintOverlay');if(o)o.hidden=true;document.body.style.overflow=document.body.dataset.hcpOverflow||'';delete document.body.dataset.hcpOverflow}
function print(){const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');if(!f?.contentWindow){alert('No se pudo preparar la impresión.');return}try{f.contentWindow.focus();f.contentWindow.print()}catch(e){console.error('Calendar print',e);alert('No se pudo abrir la impresión en este dispositivo.')}}
function installEntry(){if(document.getElementById('homebaseCalendarPrintEntry'))return;const more=document.getElementById('morePage');if(!more)return;const rosterHeader=[...more.querySelectorAll('.section-head h2')].find(h=>h.textContent.trim()==='Roster de David');const rosterSection=rosterHeader?.closest('.section');const section=document.createElement('div');section.className='section hcp-entry-section';section.id='homebaseCalendarPrintEntry';section.innerHTML=`<div class="section-head"><h2>Imprimir</h2><span>Calendario mensual</span></div><div class="hcp-entry-card"><div><strong>🖨️ Imprimir calendario</strong><small>Calendario, roster o ambos · vencimientos incluidos</small></div><button type="button">Abrir</button></div>`;section.querySelector('button').onclick=open;if(rosterSection)more.insertBefore(section,rosterSection);else more.prepend(section)}
function install(){installStyles();installEntry()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT={version:VERSION,open,build:(m,mode='combined',pending=false)=>sheet(m||currentMonth(),mode,pending)};
})();