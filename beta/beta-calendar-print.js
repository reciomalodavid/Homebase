(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='2';
let selectedMonth='';
let selectedMode='combined';
let showPending=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?new Date(`${s}T12:00:00`):null;
const monthKey=s=>/^\d{4}-\d{2}/.test(String(s||''))?String(s).slice(0,7):'';
const monthInfo=key=>{const [year,month]=String(key||'').split('-').map(Number);if(!year||!month)return null;return{year,month,key,title:new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date(year,month-1,1)).replace(/^./,c=>c.toUpperCase())}};
const people=item=>Array.isArray(item?.people)&&item.people.length?item.people:[item?.person||'Familia'];

function items(){return typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]}
function activeItems(){return items().filter(x=>!x.deletedAt)}
function familyEvents(){return activeItems().filter(x=>x.type==='event'&&x.source!=='roster')}
function rosterItems(){return activeItems().filter(x=>x.source==='roster')}
function pendingTasks(){return activeItems().filter(x=>x.type==='task'&&!x.done&&x.source!=='roster')}
function expiries(){try{const v=JSON.parse(localStorage.getItem('homebase_expiries_v2')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function profiles(){try{const v=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function profileColor(name){return profiles().find(p=>p.name===name)?.color||'#3a7be0'}
function itemColor(item){return item?.eventColor||profileColor(people(item)[0])}

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

function eventEntries(date){
 return familyEvents().filter(item=>occursOn(item,date)).map(item=>{
   const time=item.allDay?'':([item.time,item.endTime].filter(Boolean).join('–')||'');
   return {kind:'family',title:`${time?time+' ':''}${item.title||'Evento'}`,meta:people(item).join(', '),color:itemColor(item)};
 });
}
function rosterDate(item){return item?.rosterData?.sourceDate||item?.date||''}
function rosterEntry(item){
 const r=item.rosterData||{},kind=String(r.kind||'').toLowerCase(),code=String(r.code||'').toUpperCase();
 if(kind==='off'||code==='OFF'||code.startsWith('O_'))return{kind:'off',title:'OFF',meta:''};
 if(kind==='vacation'||code==='U')return{kind:'vacation',title:'VACACIONES',meta:''};
 if(kind==='standby'||code.startsWith('STBY')||code.startsWith('SBY')){
   const ci=r.ciLocal||r.startLocal||r.showUpLocal||item.time||'',co=r.coLocal||r.endLocal||r.debriefLocal||item.endTime||'';
   const label=code.includes('RS72')?'RESERVA 72H':code.includes('RES')?'RESERVA':'STBY';
   return{kind:'standby',title:[label,[ci,co].filter(Boolean).join('–')].filter(Boolean).join(' · '),meta:r.airport||r.ciAirport||r.showUpAirport||''};
 }
 if(kind==='flight'||kind==='dh'){
   const flights=Array.isArray(r.flights)?r.flights:[],route=[];
   for(const f of flights){if(!route.length&&f.dep)route.push(f.dep);if(f.arr)route.push(f.arr)}
   const ci=r.ciLocal||r.startLocal||r.showUpLocal||item.time||'',co=r.coLocal||r.endLocal||r.debriefLocal||item.endTime||'';
   return{kind:'flight',title:`VUELO${ci||co?` · ${[ci,co].filter(Boolean).join('–')}`:''}`,meta:route.join('–')};
 }
 const label=(code||'DUTY').replaceAll('_',' '),time=[r.startLocal||r.briefingLocal||item.time||'',r.endLocal||r.debriefLocal||item.endTime||''].filter(Boolean).join('–');
 return{kind:'duty',title:[label,time].filter(Boolean).join(' · '),meta:r.airport||r.ciAirport||r.showUpAirport||''};
}
function rosterEntries(key){return rosterItems().filter(item=>rosterDate(item)===key).map(rosterEntry)}
function expiryEntries(key){return expiries().filter(x=>x.expiryDate===key).map(x=>({kind:'expiry',title:`⌛ ${x.title||'Vencimiento'}`,meta:x.profileName||''}))}

function availableMonths(){
 const set=new Set();
 activeItems().forEach(item=>{const d=item.source==='roster'?rosterDate(item):item.date;if(monthKey(d))set.add(monthKey(d));if(monthKey(item.endDate))set.add(monthKey(item.endDate))});
 expiries().forEach(x=>{if(monthKey(x.expiryDate))set.add(monthKey(x.expiryDate))});
 const now=new Date();set.add(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
 return [...set].sort().reverse();
}
function currentMonth(){
 const months=availableMonths();if(selectedMonth&&months.includes(selectedMonth))return selectedMonth;
 const d=typeof state!=='undefined'&&state.month instanceof Date?state.month:new Date(),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
 return months.includes(key)?key:(months[0]||key);
}
function weekCount(info){const first=new Date(info.year,info.month-1,1),days=new Date(info.year,info.month,0).getDate(),offset=(first.getDay()+6)%7;return Math.ceil((offset+days)/7)}
function pendingForMonth(key){return pendingTasks().filter(t=>monthKey(t.date)===key).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'').localeCompare(b.time||''))}

function entriesForDay(date,mode){
 const key=isoDate(date);
 if(mode==='calendar')return [...eventEntries(date),...expiryEntries(key)];
 if(mode==='roster')return [...rosterEntries(key),...expiryEntries(key)];
 return [...eventEntries(date),...rosterEntries(key),...expiryEntries(key)];
}
function entryHtml(x){return `<div class="hcp-line ${esc(x.kind)}" ${x.color?`style="--item:${esc(x.color)}"`:''}><b>${esc(x.title)}</b>${x.meta?`<span>${esc(x.meta)}</span>`:''}</div>`}
function calendarData(info,mode){
 const first=new Date(info.year,info.month-1,1),days=new Date(info.year,info.month,0).getDate(),offset=(first.getDay()+6)%7,total=Math.ceil((offset+days)/7)*7;
 let html='',overflow=[];
 for(let i=0;i<total;i++){
   const day=i-offset+1;if(day<1||day>days){html+='<div class="hcp-cell hcp-empty"></div>';continue}
   const date=new Date(info.year,info.month-1,day),all=entriesForDay(date,mode),visible=all.slice(0,3),extra=all.slice(3);
   if(extra.length)overflow.push({day,date,entries:extra});
   html+=`<div class="hcp-cell"><div class="hcp-num">${day}</div><div class="hcp-lines">${visible.map(entryHtml).join('')}${extra.length?`<div class="hcp-more">+${extra.length} más · ver detalles</div>`:''}</div></div>`;
 }
 return{html,overflow};
}
function pendingHtml(key){
 const list=pendingForMonth(key);
 return `<aside class="hcp-pending"><h2>Pendientes</h2>${list.length?`<div class="hcp-pending-list">${list.map(t=>`<div class="hcp-task"><b>${esc(t.title||'Pendiente')}</b><span>${t.date?esc(new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(parseDate(t.date))):'Sin fecha'}${people(t).length?` · ${esc(people(t).join(', '))}`:''}</span></div>`).join('')}</div>`:'<p>Sin tareas pendientes este mes.</p>'}</aside>`;
}
function detailsPage(info,overflow){
 if(!overflow.length)return'';
 return `<section class="hcp-details-page"><header><h1>Detalles · ${esc(info.title)}</h1><p>Elementos que no caben completos en la cuadrícula mensual.</p></header><div class="hcp-details-grid">${overflow.map(group=>`<div class="hcp-detail-day"><h2>${group.day} ${new Intl.DateTimeFormat('es-ES',{month:'short'}).format(group.date)}</h2>${group.entries.map(entryHtml).join('')}</div>`).join('')}</div></section>`;
}
function modeTitle(mode){return mode==='roster'?'Roster':mode==='calendar'?'Calendario familiar':'Calendario + roster'}
function sheet(key,mode,pending){
 const info=monthInfo(key);if(!info)return'';const weeks=weekCount(info),data=calendarData(info,mode);
 return `<div class="hcp-document"><section class="hcp-sheet ${pending?'with-pending':'full'}" style="--weeks:${weeks}"><header class="hcp-head"><div><h1>${esc(modeTitle(mode))} · ${esc(info.title)}</h1><p>Homebase · Vista mensual · Vencimientos incluidos automáticamente</p></div><div class="hcp-legend">${mode==='calendar'?'Eventos familiares':mode==='roster'?'Roster':'Eventos familiares · Roster'} · ⌛ Vencimientos</div></header><div class="hcp-layout"><main class="hcp-calendar"><div class="hcp-week"><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div></div><div class="hcp-grid">${data.html}</div></main>${pending?pendingHtml(key):''}</div></section>${detailsPage(info,data.overflow)}</div>`;
}

const CSS=`*{box-sizing:border-box}html,body{margin:0;background:#eef2f6;color:#17212b;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hcp-document{display:grid;gap:20px}.hcp-sheet,.hcp-details-page{width:1120px;height:792px;margin:0 auto;background:#fff;padding:18px;color:#17212b}.hcp-sheet{display:grid;grid-template-rows:auto 1fr}.hcp-head{display:flex;align-items:end;justify-content:space-between;border-bottom:2px solid #273746;padding-bottom:9px;margin-bottom:8px}.hcp-head h1{margin:0;font-size:25px}.hcp-head p,.hcp-legend{font-size:10px;color:#697887}.hcp-head p{margin:3px 0 0}.hcp-layout{height:716px;display:grid;grid-template-columns:1fr;gap:10px}.hcp-sheet.with-pending .hcp-layout{grid-template-columns:minmax(0,83fr) minmax(0,17fr)}.hcp-calendar{min-width:0;display:grid;grid-template-rows:auto 1fr}.hcp-week,.hcp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.hcp-week{margin-bottom:5px}.hcp-week div{text-align:center;font-size:10px;font-weight:850;color:#667586;text-transform:uppercase}.hcp-grid{min-height:0;grid-template-rows:repeat(var(--weeks),1fr)}.hcp-cell{border:1px solid #dce3e9;border-radius:9px;padding:6px;background:#fff;min-width:0;min-height:0;overflow:hidden}.hcp-empty{background:#f5f7f9}.hcp-num{font-size:15px;font-weight:900;margin-bottom:4px}.hcp-lines{display:grid;gap:3px}.hcp-line{border-radius:6px;padding:4px 5px;line-height:1.1;min-width:0}.hcp-line b{display:block;font-size:8.2px;white-space:normal;overflow-wrap:anywhere}.hcp-line span{display:block;margin-top:2px;font-size:7px;color:#536271;white-space:normal;overflow-wrap:anywhere}.hcp-line.family{background:color-mix(in srgb,var(--item,#3a7be0) 14%,white);border-left:3px solid var(--item,#3a7be0)}.hcp-line.flight{background:#eaf3fb;border-left:3px solid #3a7be0}.hcp-line.off{background:#eaf7ef}.hcp-line.vacation{background:#fff0dd}.hcp-line.standby{background:#f0ecfb}.hcp-line.duty{background:#f2f3f5}.hcp-line.expiry{background:#fff5db;border-left:3px solid #c88a16}.hcp-more{font-size:7px;font-weight:800;color:#5f6f7e;padding:2px 3px}.hcp-pending{border-left:1px solid #dce3e9;padding-left:9px;overflow:hidden}.hcp-pending h2{font-size:14px;margin:0 0 7px}.hcp-pending p{font-size:8px;color:#697887}.hcp-pending-list{display:grid;gap:5px}.hcp-task{padding:6px;border-radius:7px;background:#f5f7f9}.hcp-task b{display:block;font-size:7.5px;white-space:normal;overflow-wrap:anywhere}.hcp-task span{display:block;margin-top:2px;font-size:6.5px;color:#697887;white-space:normal}.hcp-details-page{page-break-before:always}.hcp-details-page header{border-bottom:2px solid #273746;padding-bottom:10px;margin-bottom:12px}.hcp-details-page h1{margin:0;font-size:24px}.hcp-details-page header p{margin:4px 0 0;color:#697887;font-size:10px}.hcp-details-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.hcp-detail-day{border:1px solid #dce3e9;border-radius:10px;padding:9px}.hcp-detail-day h2{font-size:13px;margin:0 0 7px}.hcp-detail-day .hcp-line{margin-top:4px}@page{size:A4 landscape;margin:5mm}@media print{html,body{background:#fff}.hcp-document{gap:0}.hcp-sheet,.hcp-details-page{width:287mm;height:200mm;margin:0;padding:0;box-shadow:none}.hcp-head{padding:0 0 1.5mm;margin:0 0 1.5mm;min-height:11mm}.hcp-head h1{font-size:15pt}.hcp-head p,.hcp-legend{font-size:6pt}.hcp-layout{height:185mm;gap:1.5mm}.hcp-sheet.with-pending .hcp-layout{grid-template-columns:83fr 17fr}.hcp-week{gap:1mm;margin:0 0 1mm}.hcp-week div{font-size:6.2pt}.hcp-grid{gap:1mm}.hcp-cell{padding:1mm;border-radius:1.3mm}.hcp-num{font-size:8.5pt;margin-bottom:.5mm}.hcp-lines{gap:.45mm}.hcp-line{padding:.65mm .8mm}.hcp-line b{font-size:5.7pt}.hcp-line span{font-size:4.8pt}.hcp-more{font-size:4.6pt}.hcp-pending{padding-left:1.5mm}.hcp-pending h2{font-size:7.8pt;margin-bottom:1mm}.hcp-task{padding:.8mm}.hcp-task b{font-size:5pt}.hcp-task span{font-size:4.3pt}.hcp-details-page header{padding-bottom:1.5mm;margin-bottom:2mm}.hcp-details-page h1{font-size:14pt}.hcp-details-grid{gap:2mm}.hcp-detail-day{padding:1.5mm}.hcp-detail-day h2{font-size:7pt}}`;

function documentHtml(key,mode,pending){return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>${sheet(key,mode,pending)}</body></html>`}
function installStyles(){
 if(document.getElementById('homebaseCalendarPrintStyles'))return;
 const s=document.createElement('style');s.id='homebaseCalendarPrintStyles';
 s.textContent=`#homebaseCalendarPrintOverlay[hidden]{display:none!important}#homebaseCalendarPrintOverlay{position:fixed;inset:0;z-index:5100;background:#eef2f6;overflow:auto;padding:10px}.hcp-toolbar{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:minmax(135px,1fr) minmax(150px,1fr) auto auto auto;gap:7px;align-items:end;padding:9px;margin:0 auto 10px;max-width:1080px;background:rgba(255,255,255,.97);border-radius:15px;box-shadow:0 8px 28px rgba(20,35,50,.13)}.hcp-toolbar label{margin:0;font-size:10px;color:#667586}.hcp-toolbar select{margin-top:4px;padding:9px}.hcp-toggle{display:flex!important;align-items:center;gap:6px;min-height:40px;margin:0!important;padding:0 6px;font-size:11px!important}.hcp-toggle input{width:auto}.hcp-toolbar button{border:0;border-radius:10px;padding:10px 13px;font-weight:850;white-space:nowrap}.hcp-close{background:#e4e8ec;color:#273746}.hcp-print{background:#493991;color:#fff}.hcp-print:disabled{opacity:.45}.hcp-preview-shell{max-width:100%;overflow:auto;-webkit-overflow-scrolling:touch;padding-bottom:18px}.hcp-preview{width:max-content;min-width:1120px}.hcp-preview .hcp-sheet,.hcp-preview .hcp-details-page{box-shadow:0 18px 50px rgba(20,35,50,.16);border-radius:16px}.hcp-entry-section{margin-top:14px}.hcp-entry-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-radius:18px;background:linear-gradient(135deg,rgba(111,88,201,.11),rgba(58,123,224,.08));border:1px solid rgba(111,88,201,.18)}.hcp-entry-card strong{display:block;font-size:15px}.hcp-entry-card small{display:block;margin-top:3px;color:#687587;font-size:11px}.hcp-entry-card button{border:0;border-radius:12px;background:#5f4bb4;color:#fff;padding:11px 14px;font-weight:850}@media(max-width:700px){#homebaseCalendarPrintOverlay{padding:7px}.hcp-toolbar{grid-template-columns:1fr 1fr;padding:8px;gap:6px}.hcp-toggle{grid-column:1/-1;min-height:32px}.hcp-close,.hcp-print{min-height:42px}.hcp-entry-card{padding:13px}.hcp-entry-card button{padding:10px 12px}}${CSS}`;
 document.head.appendChild(s);
}
function ensureOverlay(){
 let o=document.getElementById('homebaseCalendarPrintOverlay');if(o)return o;
 o=document.createElement('div');o.id='homebaseCalendarPrintOverlay';o.hidden=true;
 o.innerHTML=`<div class="hcp-toolbar"><label>Mes<select id="hcpMonth"></select></label><label>Contenido<select id="hcpMode"><option value="combined">Calendario + roster</option><option value="calendar">Solo calendario</option><option value="roster">Solo roster</option></select></label><label class="hcp-toggle"><input id="hcpPending" type="checkbox"> Mostrar pendientes</label><button class="hcp-close" type="button">Cerrar</button><button class="hcp-print" type="button">Imprimir / Guardar PDF</button></div><div class="hcp-preview-shell"><div class="hcp-preview"></div></div><iframe class="hcp-frame" title="Calendario para imprimir" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0"></iframe>`;
 document.body.appendChild(o);
 o.querySelector('.hcp-close').onclick=close;o.querySelector('.hcp-print').onclick=print;
 o.querySelector('#hcpMonth').onchange=e=>{selectedMonth=e.target.value;refresh()};
 o.querySelector('#hcpMode').onchange=e=>{selectedMode=e.target.value;refresh()};
 o.querySelector('#hcpPending').onchange=e=>{showPending=e.target.checked;refresh()};
 return o;
}
function prepareFrame(o){const f=o.querySelector('.hcp-frame'),b=o.querySelector('.hcp-print');b.disabled=true;f.onload=()=>{b.disabled=false};f.srcdoc=documentHtml(selectedMonth||currentMonth(),selectedMode,showPending)}
function refresh(){const o=ensureOverlay(),key=selectedMonth||currentMonth();o.querySelector('.hcp-preview').innerHTML=sheet(key,selectedMode,showPending);prepareFrame(o)}
function open(){
 installStyles();const o=ensureOverlay(),months=availableMonths();selectedMonth=currentMonth();
 const sel=o.querySelector('#hcpMonth');sel.innerHTML=months.map(m=>`<option value="${esc(m)}">${esc(monthInfo(m)?.title||m)}</option>`).join('');sel.value=selectedMonth;
 o.querySelector('#hcpMode').value=selectedMode;o.querySelector('#hcpPending').checked=showPending;refresh();
 document.body.dataset.hcpOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';o.hidden=false;o.scrollTop=0;
}
function close(){const o=document.getElementById('homebaseCalendarPrintOverlay');if(o)o.hidden=true;document.body.style.overflow=document.body.dataset.hcpOverflow||'';delete document.body.dataset.hcpOverflow}
function print(){const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');if(!f?.contentWindow){alert('No se pudo preparar la impresión.');return}try{f.contentWindow.focus();f.contentWindow.print()}catch(e){console.error('Calendar print',e);alert('No se pudo abrir la impresión en este dispositivo.')}}
function installEntry(){
 if(document.getElementById('homebaseCalendarPrintEntry'))return;const more=document.getElementById('morePage');if(!more)return;
 const rosterHeader=[...more.querySelectorAll('.section-head h2')].find(h=>h.textContent.trim()==='Roster de David'),rosterSection=rosterHeader?.closest('.section'),section=document.createElement('div');
 section.className='section hcp-entry-section';section.id='homebaseCalendarPrintEntry';section.innerHTML=`<div class="section-head"><h2>Imprimir</h2><span>Calendario mensual</span></div><div class="hcp-entry-card"><div><strong>🖨️ Imprimir calendario</strong><small>Calendario, roster o ambos · vencimientos incluidos</small></div><button type="button">Abrir</button></div>`;
 section.querySelector('button').onclick=open;if(rosterSection)more.insertBefore(section,rosterSection);else more.prepend(section);
}
function install(){installStyles();installEntry()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT={version:VERSION,open,build:(m,mode='combined',pending=false)=>sheet(m||currentMonth(),mode,pending)};
})();