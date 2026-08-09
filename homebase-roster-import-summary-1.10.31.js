(()=>{
'use strict';

const VERSION='1.10.31';
function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function fmtDate(iso){if(!iso)return '';const [y,m,d]=String(iso).split('-').map(Number);if(!y||!m||!d)return iso;return new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric',month:'short'}).format(new Date(y,m-1,d)).replace('.','')}
function codeOf(item){return String(item?.rosterData?.code||'').replaceAll('_',' ')||''}
function titleOf(item){return item?.title||item?.rosterData?.title||codeOf(item)||'Duty'}
function timeOf(item){const start=item?.time||'',end=item?.endTime||'';return start?`${start}${end?`–${end}`:''}`:'Todo el día'}

function installStyles(){
  if(document.getElementById('homebaseRosterImportSummaryStyles'))return;
  const s=document.createElement('style');
  s.id='homebaseRosterImportSummaryStyles';
  s.textContent=`
    #rosterSummary.homebase-roster-change-summary{grid-template-columns:repeat(4,minmax(0,1fr))!important}
    #rosterSummary.homebase-roster-change-summary .roster-stat:nth-child(1) strong{color:#2f9e74}
    #rosterSummary.homebase-roster-change-summary .roster-stat:nth-child(2) strong{color:#d9781f}
    #rosterSummary.homebase-roster-change-summary .roster-stat:nth-child(3) strong{color:#d84a55}
    #rosterSummary.homebase-roster-change-summary .roster-stat:nth-child(4) strong{color:#687587}
    .homebase-roster-changes{margin:14px 0 4px;padding:14px;border-radius:17px;background:rgba(255,255,255,.62);border:1px solid rgba(93,116,145,.13)}
    .homebase-roster-changes-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
    .homebase-roster-changes-head strong{font-size:14px}.homebase-roster-changes-head span{font-size:11px;color:var(--muted)}
    .homebase-roster-change-list{display:grid;gap:7px}.homebase-roster-change-row{display:grid;grid-template-columns:66px 1fr auto;gap:9px;align-items:center;padding:8px 0;border-top:1px solid rgba(93,116,145,.10)}
    .homebase-roster-change-row:first-child{border-top:0}.homebase-roster-change-date{font-size:11px;color:var(--muted);text-transform:capitalize}.homebase-roster-change-title{font-size:13px;font-weight:800}.homebase-roster-change-meta{font-size:10px;color:var(--muted);margin-top:2px}
    .homebase-roster-change-pill{font-size:9px;font-weight:900;padding:5px 7px;border-radius:999px;white-space:nowrap}.homebase-roster-change-pill.new{background:#e7f7ef;color:#247a58}.homebase-roster-change-pill.changed{background:#fff1df;color:#a45d13}.homebase-roster-change-pill.removed{background:#fdebed;color:#b13f4b}.homebase-roster-nochanges{font-size:12px;color:var(--muted);padding:3px 0}
    @media(max-width:520px){#rosterSummary.homebase-roster-change-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}.homebase-roster-change-row{grid-template-columns:58px 1fr}.homebase-roster-change-pill{grid-column:2;justify-self:start}}
  `;
  document.head.appendChild(s);
}

function changeRow(item,status){
  const labels={new:'NUEVO',changed:'MODIFICADO',removed:'RETIRADO'},code=codeOf(item);
  return `<div class="homebase-roster-change-row"><div class="homebase-roster-change-date">${esc(fmtDate(item?.date))}</div><div><div class="homebase-roster-change-title">${esc(titleOf(item))}</div><div class="homebase-roster-change-meta">${esc([code,timeOf(item)].filter(Boolean).join(' · '))}</div></div><span class="homebase-roster-change-pill ${status}">${labels[status]}</span></div>`;
}

function enhance(plan){
  if(!plan?.result)return;
  installStyles();
  const r=plan.result,summary=document.getElementById('rosterSummary');
  if(summary){summary.classList.add('homebase-roster-change-summary');summary.innerHTML=`<div class="roster-stat"><strong>${r.added||0}</strong><span>Nuevos</span></div><div class="roster-stat"><strong>${r.changed||0}</strong><span>Modificados</span></div><div class="roster-stat"><strong>${r.removed||0}</strong><span>Retirados</span></div><div class="roster-stat"><strong>${r.unchanged||0}</strong><span>Sin cambios</span></div>`}
  let box=document.getElementById('homebaseRosterChanges');
  if(!box){box=document.createElement('div');box.id='homebaseRosterChanges';box.className='homebase-roster-changes';const anchor=document.getElementById('rosterPreviewList');anchor?.parentNode?.insertBefore(box,anchor)}
  const changed=(plan.preview||[]).filter(x=>x.status==='new'||x.status==='changed');
  const removed=(plan.removedItems||[]).map(item=>({item,status:'removed'}));
  const rows=[...changed,...removed];
  box.innerHTML=`<div class="homebase-roster-changes-head"><strong>Cambios detectados</strong><span>${r.changes||0} en total</span></div>${rows.length?`<div class="homebase-roster-change-list">${rows.map(x=>changeRow(x.item,x.status)).join('')}</div>`:'<div class="homebase-roster-nochanges">Este roster no cambia ningún duty del periodo.</div>'}`;
}

function install(){
  installStyles();
  if(typeof window.renderPendingRoster!=='function'){setTimeout(install,250);return}
  if(window.renderPendingRoster.__homebaseChangeSummary)return;
  const original=window.renderPendingRoster;
  const wrapped=function(plan,doc){const result=original.apply(this,arguments);try{enhance(plan)}catch(error){console.warn('Roster summary skipped',error)}return result};
  wrapped.__homebaseChangeSummary=true;
  window.renderPendingRoster=wrapped;
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_ROSTER_IMPORT_SUMMARY={version:VERSION,enhance};
})();