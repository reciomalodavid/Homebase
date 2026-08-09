(()=>{
'use strict';

const VERSION='1.10.31';
function activeRoster(){
  if(typeof state==='undefined'||!Array.isArray(state.items))return[];
  const start=state.rosterMeta?.periodStart||'',end=state.rosterMeta?.periodEnd||'';
  return state.items.filter(item=>{
    if(item?.source!=='roster'||item?.deletedAt)return false;
    const d=item?.rosterData?.sourceDate||item?.date||'';
    if(start&&d<start)return false;if(end&&d>end)return false;return true;
  });
}
function periodLabel(){
  const start=state?.rosterMeta?.periodStart;if(!start)return 'Último roster importado';
  const d=new Date(`${start}T12:00:00`);
  return new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(d).replace(/^./,c=>c.toUpperCase());
}
function summarize(items){
  const out={flightDays:0,flights:0,standby:0,off:0,vacation:0,trainingGround:0,hotels:0};
  for(const item of items){
    const r=item.rosterData||{},kind=String(r.kind||'').toLowerCase();
    if(kind==='flight'||kind==='dh'){out.flightDays++;out.flights+=(Array.isArray(r.flights)?r.flights.filter(f=>!f?.dh).length:0)}
    else if(kind==='standby')out.standby++;
    else if(kind==='off')out.off++;
    else if(kind==='vacation')out.vacation++;
    else if(kind==='training'||kind==='ground')out.trainingGround++;
    if(r.hotel)out.hotels++;
  }
  return out;
}
function ensureStyles(){
  if(document.getElementById('homebaseRosterMonthlySummaryStyles'))return;
  const s=document.createElement('style');s.id='homebaseRosterMonthlySummaryStyles';s.textContent=`
    .homebase-roster-month-summary{margin:14px 0;padding:14px;border-radius:18px;background:rgba(111,88,201,.07);border:1px solid rgba(111,88,201,.14)}
    .homebase-roster-month-summary-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:10px}.homebase-roster-month-summary-head strong{font-size:14px}.homebase-roster-month-summary-head span{font-size:11px;color:#6f7d8a;text-align:right}
    .homebase-roster-month-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.homebase-roster-month-summary-stat{padding:10px 8px;border-radius:13px;background:rgba(255,255,255,.72);text-align:center;border:1px solid rgba(255,255,255,.9)}.homebase-roster-month-summary-stat b{display:block;font-size:20px;line-height:1.1}.homebase-roster-month-summary-stat small{display:block;margin-top:4px;font-size:10px;color:#69798a;line-height:1.15}@media(max-width:390px){.homebase-roster-month-summary-grid{grid-template-columns:repeat(2,1fr)}}`;
  document.head.appendChild(s);
}
function renderSummary(){
  const dialog=document.getElementById('rosterDialog'),anchor=document.getElementById('rosterOptionsPanel');if(!dialog||!anchor)return;
  let box=document.getElementById('homebaseRosterMonthlySummary');
  if(!box){box=document.createElement('section');box.id='homebaseRosterMonthlySummary';box.className='homebase-roster-month-summary';anchor.parentNode.insertBefore(box,anchor)}
  const items=activeRoster();if(!items.length){box.hidden=true;return}box.hidden=false;
  const s=summarize(items);
  box.innerHTML=`<div class="homebase-roster-month-summary-head"><strong>Resumen del roster</strong><span>${periodLabel()}</span></div><div class="homebase-roster-month-summary-grid"><div class="homebase-roster-month-summary-stat"><b>${s.flights}</b><small>Vuelos</small></div><div class="homebase-roster-month-summary-stat"><b>${s.flightDays}</b><small>Días de vuelo</small></div><div class="homebase-roster-month-summary-stat"><b>${s.standby}</b><small>Standby</small></div><div class="homebase-roster-month-summary-stat"><b>${s.off}</b><small>Días libres</small></div><div class="homebase-roster-month-summary-stat"><b>${s.vacation}</b><small>Vacaciones</small></div><div class="homebase-roster-month-summary-stat"><b>${s.hotels}</b><small>Noches fuera</small></div><div class="homebase-roster-month-summary-stat"><b>${s.trainingGround}</b><small>Training / ground</small></div></div>`;
}
function install(){
  ensureStyles();const dialog=document.getElementById('rosterDialog');if(!dialog){setTimeout(install,250);return}
  dialog.addEventListener('toggle',()=>{if(dialog.open)setTimeout(renderSummary,0)});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#openRosterRow,#openRosterButton,#applyRosterImport'))setTimeout(renderSummary,100)},true);
  window.addEventListener('homebase:roster-deduped',()=>setTimeout(renderSummary,0));
  setTimeout(renderSummary,300);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_ROSTER_MONTHLY_SUMMARY={version:VERSION,render:renderSummary};
})();