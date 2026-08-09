(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
const FILTERS=[['all','Todo'],['Evento','Eventos'],['Tarea','Tareas'],['Roster','Roster'],['Vencimiento','Vencimientos']];
const TIME_FILTERS=[['future','Desde hoy'],['30d','30 días'],['12m','12 meses'],['history','Histórico'],['all','Todo']];
let activeFilter='all';
let activeTimeFilter='future';
let returnState=null;
let navigatingFromSearch=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
function formatDate(value){if(!value)return 'Sin fecha';const date=new Date(`${value}T12:00:00`);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date)}
function typeClass(type){return type==='Roster'?'roster':type==='Tarea'?'task':type==='Vencimiento'?'expiry':'event'}
function api(){return window.HOMEBASE_BETA_NAVIGATION_UX}
function overlay(){return document.getElementById('betaGlobalSearchOverlay')}
function currentQuery(){return document.getElementById('betaGlobalSearchInput')?.value?.trim()||''}
function todayIso(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDaysIso(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function timeMatches(row){
 const date=String(row?.date||'');
 const today=todayIso();
 if(activeTimeFilter==='all')return true;
 if(activeTimeFilter==='history')return !!date&&date<today;
 if(!date)return true;
 if(date<today)return false;
 if(activeTimeFilter==='30d')return date<=addDaysIso(30);
 if(activeTimeFilter==='12m')return date<=addDaysIso(365);
 return true;
}
function filteredRows(query){let rows=api()?.search?.(query)||[];if(activeFilter!=='all')rows=rows.filter(row=>row.type===activeFilter);return rows.filter(timeMatches)}
function renderEnhanced(){
 const input=document.getElementById('betaGlobalSearchInput'),results=document.getElementById('betaGlobalSearchResults'),count=document.getElementById('betaGlobalSearchCount');
 if(!input||!results)return;
 const q=input.value.trim();
 syncFilterButtons();
 if(q.length<2){results.innerHTML='<div class="bgs-empty">Escribe al menos 2 letras para buscar.</div>';if(count)count.textContent='';return}
 const rows=filteredRows(q);if(count)count.textContent=`${rows.length} resultado${rows.length===1?'':'s'}`;
 results.innerHTML=rows.length?rows.map(row=>`<button type="button" class="bgs-result" data-target="${esc(row.target)}" data-date="${esc(row.date)}" data-title="${esc(row.title)}"><span class="bgs-type ${typeClass(row.type)}">${esc(row.type)}</span><span class="bgs-copy"><strong>${esc(row.title)}</strong><span class="bgs-date">${esc(formatDate(row.date))}</span>${row.meta?`<span class="bgs-meta">${esc(row.meta)}</span>`:''}</span><span class="bgs-arrow">›</span></button>`).join(''):'<div class="bgs-empty">No hay resultados con estos filtros.</div>';
}
function syncFilterButtons(){document.querySelectorAll('.bgs-filter').forEach(button=>button.classList.toggle('active',button.dataset.filter===activeFilter));document.querySelectorAll('.bgs-time-filter').forEach(button=>button.classList.toggle('active',button.dataset.timeFilter===activeTimeFilter))}
function ensureFilters(){
 const shell=overlay()?.querySelector('.bgs-shell');if(!shell)return false;
 let filters=shell.querySelector('.bgs-filters');
 if(!filters){filters=document.createElement('div');filters.className='bgs-filters';filters.innerHTML=FILTERS.map(([value,label])=>`<button type="button" class="bgs-filter" data-filter="${esc(value)}">${esc(label)}</button>`).join('');const sub=shell.querySelector('.bgs-sub');sub?.insertAdjacentElement('afterend',filters);filters.addEventListener('click',event=>{const button=event.target.closest('.bgs-filter');if(!button)return;activeFilter=button.dataset.filter||'all';renderEnhanced()})}
 let timeFilters=shell.querySelector('.bgs-time-filters');
 if(!timeFilters){timeFilters=document.createElement('div');timeFilters.className='bgs-time-filters';timeFilters.innerHTML=TIME_FILTERS.map(([value,label])=>`<button type="button" class="bgs-time-filter" data-time-filter="${esc(value)}">${esc(label)}</button>`).join('');filters.insertAdjacentElement('afterend',timeFilters);timeFilters.addEventListener('click',event=>{const button=event.target.closest('.bgs-time-filter');if(!button)return;activeTimeFilter=button.dataset.timeFilter||'future';renderEnhanced()})}
 syncFilterButtons();return true;
}
function ensureStyles(){if(document.getElementById('betaSearchEnhancementStyles'))return;const style=document.createElement('style');style.id='betaSearchEnhancementStyles';style.textContent=`.bgs-filters,.bgs-time-filters{display:flex;gap:7px;overflow-x:auto;padding:0 1px 9px;scrollbar-width:none}.bgs-filters::-webkit-scrollbar,.bgs-time-filters::-webkit-scrollbar{display:none}.bgs-time-filters{padding-bottom:12px}.bgs-filter,.bgs-time-filter{flex:0 0 auto;border:1px solid rgba(93,112,130,.14);border-radius:999px;background:rgba(255,255,255,.78);color:#677686;padding:7px 10px;font-size:11px;font-weight:850}.bgs-filter.active,.bgs-time-filter.active{background:#6f58c9;color:#fff;border-color:#6f58c9}.beta-search-return{display:none;width:max-content;max-width:calc(100% - 16px);margin:-4px 0 10px 4px;border:1px solid rgba(111,88,201,.20);border-radius:999px;background:rgba(255,255,255,.78);color:#634db7;padding:8px 11px;font-size:12px;font-weight:850;box-shadow:0 6px 18px rgba(45,94,139,.07)}.beta-search-return.show{display:inline-flex;align-items:center;gap:5px}@media(min-width:768px){.bgs-filter,.bgs-time-filter{padding:8px 12px}.beta-search-return{margin-left:8px}}`;document.head.appendChild(style)}
function ensureReturnButton(){
 let button=document.getElementById('betaSearchReturnButton');if(button)return button;
 const topbar=document.querySelector('.topbar');if(!topbar)return null;
 button=document.createElement('button');button.id='betaSearchReturnButton';button.className='beta-search-return';button.type='button';button.textContent='← Volver a búsqueda';topbar.insertAdjacentElement('afterend',button);
 button.addEventListener('click',()=>{if(!returnState)return;const saved={...returnState};api()?.openSearch?.();setTimeout(()=>{ensureFilters();activeFilter=saved.filter||'all';activeTimeFilter=saved.timeFilter||'future';const input=document.getElementById('betaGlobalSearchInput');if(input){input.value=saved.query||'';renderEnhanced();input.focus()}},70)});
 return button;
}
function showReturnButton(){const button=ensureReturnButton();if(button&&returnState)button.classList.add('show')}
function clearReturn(){returnState=null;ensureReturnButton()?.classList.remove('show')}
function install(){
 ensureStyles();let tries=0;const tick=()=>{tries++;ensureFilters();ensureReturnButton();if(tries<30&&!overlay())setTimeout(tick,120)};tick();
 document.addEventListener('input',event=>{if(event.target?.id==='betaGlobalSearchInput')setTimeout(renderEnhanced,0)},true);
 document.addEventListener('click',event=>{
   const result=event.target.closest?.('#betaGlobalSearchResults .bgs-result');
   if(result){returnState={query:currentQuery(),filter:activeFilter,timeFilter:activeTimeFilter};navigatingFromSearch=true;setTimeout(()=>{showReturnButton();navigatingFromSearch=false},180);return}
   const nav=event.target.closest?.('.bottom-nav [data-page]');
   if(nav){if(!navigatingFromSearch)clearReturn();return}
   if(event.target.closest?.('#betaGlobalSearchButton')){activeFilter='all';activeTimeFilter='future';setTimeout(()=>{ensureFilters();renderEnhanced()},80)}
 },true);
 window.addEventListener('pageshow',()=>{ensureFilters();ensureReturnButton();if(returnState)showReturnButton()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SEARCH_ENHANCEMENTS={version:VERSION,render:renderEnhanced,clearReturn};
})();
