(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='3';
const SEARCH_LIMIT=80;

function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim()}
function norm(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function formatDate(value){if(!value)return 'Sin fecha';const date=new Date(`${value}T12:00:00`);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date)}

function renameMoreToManagement(){
  const nav=document.querySelector('.bottom-nav [data-page="morePage"]');
  if(nav){
    const icon=nav.querySelector('span');
    nav.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()==='Más')node.textContent='Gestión'});
    nav.setAttribute('aria-label','Gestión');
    if(icon&&text(nav).includes('Más'))nav.innerHTML=icon.outerHTML+'Gestión';
  }
  const title=document.querySelector('#morePage .hero-row h1,#morePage h1');
  if(title&&text(title)==='Más')title.textContent='Gestión';
}
function pendingPage(){return document.getElementById('tasksPage')}
function hidePendingHeroNewButton(){const page=pendingPage();if(!page)return;const button=page.querySelector('#newTask,.new-btn');if(button){button.hidden=true;button.style.setProperty('display','none','important');button.setAttribute('aria-hidden','true')}}
function keepGlobalQuickAddVisible(){const fab=document.querySelector('.event-fab');if(!fab)return;fab.hidden=false;fab.removeAttribute('aria-hidden');fab.style.setProperty('display','grid','important');fab.style.setProperty('visibility','visible','important');fab.style.setProperty('opacity','1','important');fab.style.setProperty('pointer-events','auto','important')}

function profilesMap(){
  try{const profiles=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');if(Array.isArray(profiles))return new Map(profiles.map(p=>[String(p.id||p.uuid||p.name||''),String(p.name||'')]))}catch{}
  return new Map();
}
function coreSearchRows(){
  if(typeof state==='undefined'||!Array.isArray(state.items))return[];
  return state.items.filter(item=>!item?.deletedAt).map(item=>{
    const roster=item.source==='roster',r=item.rosterData||{};
    const type=roster?'Roster':item.type==='task'?'Tarea':'Evento';
    const people=Array.isArray(item.people)?item.people.join(', '):(item.person||'');
    const flights=Array.isArray(r.flights)?r.flights.map(f=>`${f.number||''} ${f.dep||''}-${f.arr||''}`).join(' '):'';
    const route=r.route||flights;
    const title=item.title||r.title||r.code||(roster?'Roster':'Sin título');
    const meta=[people,item.category,r.code,route,r.hotel,r.hotelAirport].filter(Boolean).join(' · ');
    const haystack=norm([title,item.notes,people,item.category,item.categoryOther,item.date,item.endDate,r.code,r.kind,r.route,r.hotel,r.hotelAirport,flights].filter(Boolean).join(' '));
    return {type,title,date:item.date||r.sourceDate||'',meta,haystack};
  });
}
function expirySearchRows(){
  let expiries=[];try{const value=JSON.parse(localStorage.getItem('homebase_expiries_v2')||'[]');if(Array.isArray(value))expiries=value}catch{}
  const profiles=profilesMap();
  return expiries.map(item=>{
    const owner=item.profileName||profiles.get(String(item.profileId||''))||'';
    const title=item.title||'Vencimiento';
    const meta=[owner,item.notes].filter(Boolean).join(' · ');
    const haystack=norm([title,owner,item.notes,item.expiryDate].filter(Boolean).join(' '));
    return {type:'Vencimiento',title,date:item.expiryDate||'',meta,haystack};
  });
}
function searchRows(query){
  const q=norm(query);if(q.length<2)return[];
  const terms=q.split(' ').filter(Boolean);
  return [...coreSearchRows(),...expirySearchRows()].filter(row=>terms.every(term=>row.haystack.includes(term))).sort((a,b)=>{
    if(a.date&&b.date)return a.date.localeCompare(b.date);if(a.date)return -1;if(b.date)return 1;return a.title.localeCompare(b.title,'es');
  }).slice(0,SEARCH_LIMIT);
}
function typeClass(type){return type==='Roster'?'roster':type==='Tarea'?'task':type==='Vencimiento'?'expiry':'event'}
function renderSearch(){
  const input=document.getElementById('betaGlobalSearchInput'),results=document.getElementById('betaGlobalSearchResults'),count=document.getElementById('betaGlobalSearchCount');if(!input||!results)return;
  const q=input.value.trim();
  if(q.length<2){results.innerHTML='<div class="bgs-empty">Escribe al menos 2 letras para buscar.</div>';if(count)count.textContent='';return}
  const rows=searchRows(q);if(count)count.textContent=`${rows.length}${rows.length===SEARCH_LIMIT?'+':''} resultado${rows.length===1?'':'s'}`;
  results.innerHTML=rows.length?rows.map(row=>`<article class="bgs-result"><span class="bgs-type ${typeClass(row.type)}">${esc(row.type)}</span><div class="bgs-copy"><strong>${esc(row.title)}</strong><div class="bgs-date">${esc(formatDate(row.date))}</div>${row.meta?`<div class="bgs-meta">${esc(row.meta)}</div>`:''}</div></article>`).join(''):'<div class="bgs-empty">No he encontrado nada con esa búsqueda.</div>';
}
function closeSearch(){const overlay=document.getElementById('betaGlobalSearchOverlay');if(overlay)overlay.hidden=true;document.body.style.overflow=document.body.dataset.bgsOverflow||'';delete document.body.dataset.bgsOverflow}
function openSearch(){const overlay=ensureSearchUI();overlay.hidden=false;document.body.dataset.bgsOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';const input=overlay.querySelector('#betaGlobalSearchInput');input.value='';renderSearch();setTimeout(()=>input.focus(),60)}
function ensureSearchStyles(){
  if(document.getElementById('betaGlobalSearchStyles'))return;
  const style=document.createElement('style');style.id='betaGlobalSearchStyles';style.textContent=`#betaGlobalSearchButton{position:fixed;right:14px;top:calc(12px + env(safe-area-inset-top));z-index:1250;width:40px;height:40px;border:1px solid rgba(255,255,255,.88);border-radius:13px;background:rgba(255,255,255,.88);box-shadow:0 8px 24px rgba(45,94,139,.14);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);font-size:19px;display:grid;place-items:center;color:#273746}#betaGlobalSearchOverlay[hidden]{display:none!important}#betaGlobalSearchOverlay{position:fixed;inset:0;z-index:4900;background:rgba(238,246,253,.98);padding:calc(14px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));overflow:auto}.bgs-shell{width:min(680px,100%);margin:0 auto}.bgs-head{display:flex;align-items:center;gap:9px;position:sticky;top:0;z-index:2;padding-bottom:10px;background:rgba(238,246,253,.96)}#betaGlobalSearchInput{flex:1;min-width:0;border:1px solid rgba(93,112,130,.18);border-radius:15px;padding:13px 14px;background:#fff;font-size:16px;box-shadow:0 8px 24px rgba(45,94,139,.08)}.bgs-close{border:0;border-radius:13px;padding:12px 13px;background:#e6ebef;color:#273746;font-weight:850}.bgs-sub{display:flex;justify-content:space-between;align-items:center;color:#718090;font-size:11px;margin:3px 2px 10px}.bgs-results{display:grid;gap:8px}.bgs-result{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid rgba(93,112,130,.12);border-radius:15px;background:#fff;box-shadow:0 8px 22px rgba(45,94,139,.06)}.bgs-type{flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:900;letter-spacing:.2px;background:#eef1f4;color:#566575}.bgs-type.event{background:#eaf3fb;color:#346c9d}.bgs-type.task{background:#f5efff;color:#7053a8}.bgs-type.roster{background:#e9f7ef;color:#397a58}.bgs-type.expiry{background:#fff0df;color:#a45a13}.bgs-copy{min-width:0}.bgs-copy strong{display:block;font-size:14px;color:#182230}.bgs-date{margin-top:2px;font-size:11px;color:#657586}.bgs-meta{margin-top:3px;font-size:11px;line-height:1.3;color:#7a8794;white-space:normal}.bgs-empty{padding:30px 16px;text-align:center;color:#738292;font-size:13px}@media(max-width:767px){#betaGlobalSearchButton{top:calc(9px + env(safe-area-inset-top));right:10px;width:38px;height:38px}}`;
  document.head.appendChild(style);
}
function ensureSearchUI(){
  ensureSearchStyles();
  let button=document.getElementById('betaGlobalSearchButton');
  if(!button){button=document.createElement('button');button.id='betaGlobalSearchButton';button.type='button';button.setAttribute('aria-label','Buscar en Homebase');button.textContent='⌕';button.addEventListener('click',openSearch);document.body.appendChild(button)}
  let overlay=document.getElementById('betaGlobalSearchOverlay');
  if(!overlay){overlay=document.createElement('div');overlay.id='betaGlobalSearchOverlay';overlay.hidden=true;overlay.innerHTML='<div class="bgs-shell"><div class="bgs-head"><input id="betaGlobalSearchInput" type="search" inputmode="search" autocomplete="off" placeholder="Buscar eventos, tareas, roster…"><button type="button" class="bgs-close">Cerrar</button></div><div class="bgs-sub"><span>Busca también vencimientos</span><span id="betaGlobalSearchCount"></span></div><div id="betaGlobalSearchResults" class="bgs-results"></div></div>';document.body.appendChild(overlay);overlay.querySelector('.bgs-close').addEventListener('click',closeSearch);overlay.querySelector('#betaGlobalSearchInput').addEventListener('input',renderSearch)}
  return overlay;
}

function apply(){renameMoreToManagement();hidePendingHeroNewButton();keepGlobalQuickAddVisible();ensureSearchUI()}
function applyAfterNavigation(){requestAnimationFrame(()=>requestAnimationFrame(apply));setTimeout(apply,120)}
function install(){apply();document.addEventListener('click',event=>{if(event.target.closest('.bottom-nav'))applyAfterNavigation()},true);window.addEventListener('pageshow',applyAfterNavigation);document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAfterNavigation()});document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSearch()})}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_NAVIGATION_UX={version:VERSION,apply,openSearch,search:searchRows};
})();
