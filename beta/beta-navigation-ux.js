(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='4';
const SEARCH_LIMIT=80;
const GENERIC_VALUES=new Set(['familia','family','otro','otros','evento','tarea']);
const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim()}
function norm(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function formatDate(value){if(!value)return 'Sin fecha';const date=new Date(`${value}T12:00:00`);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date)}
function uniqueMeaningful(values){const out=[];for(const value of values){const s=String(value||'').trim();if(!s||GENERIC_VALUES.has(norm(s))||out.some(x=>norm(x)===norm(s)))continue;out.push(s)}return out}

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
    const rawPeople=Array.isArray(item.people)?item.people:(item.person?[item.person]:[]);
    const people=uniqueMeaningful(rawPeople);
    const category=GENERIC_VALUES.has(norm(item.category))?'':String(item.category||'').trim();
    const flights=Array.isArray(r.flights)?r.flights.map(f=>`${f.number||''} ${f.dep||''}-${f.arr||''}`).join(' '):'';
    const route=r.route||flights;
    const title=item.title||r.title||r.code||(roster?'Roster':'Sin título');
    const metaParts=uniqueMeaningful([...people,category,item.categoryOther,r.code,route,r.hotelAirport]);
    const meta=metaParts.join(' · ');
    const haystack=norm([title,item.notes,...people,category,item.categoryOther,item.date,item.endDate,r.code,r.kind,r.route,r.hotel,r.hotelAirport,flights].filter(Boolean).join(' '));
    return {type,title,date:item.date||r.sourceDate||'',meta,haystack,itemId:String(item.id||''),target:type==='Tarea'?'tasksPage':'calendarPage'};
  });
}
function expirySearchRows(){
  let expiries=[];try{const value=JSON.parse(localStorage.getItem('homebase_expiries_v2')||'[]');if(Array.isArray(value))expiries=value}catch{}
  const profiles=profilesMap();
  return expiries.map(item=>{
    const owner=item.profileName||profiles.get(String(item.profileId||''))||'';
    const title=item.title||'Vencimiento';
    const meta=uniqueMeaningful([owner,item.notes]).join(' · ');
    const haystack=norm([title,owner,item.notes,item.expiryDate].filter(Boolean).join(' '));
    return {type:'Vencimiento',title,date:item.expiryDate||'',meta,haystack,itemId:String(item.id||''),target:'morePage'};
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
  results.innerHTML=rows.length?rows.map(row=>`<button type="button" class="bgs-result" data-target="${esc(row.target)}" data-date="${esc(row.date)}" data-title="${esc(row.title)}"><span class="bgs-type ${typeClass(row.type)}">${esc(row.type)}</span><span class="bgs-copy"><strong>${esc(row.title)}</strong><span class="bgs-date">${esc(formatDate(row.date))}</span>${row.meta?`<span class="bgs-meta">${esc(row.meta)}</span>`:''}</span><span class="bgs-arrow">›</span></button>`).join(''):'<div class="bgs-empty">No he encontrado nada con esa búsqueda.</div>';
}
function closeSearch(){const overlay=document.getElementById('betaGlobalSearchOverlay');if(overlay)overlay.hidden=true;document.body.style.overflow=document.body.dataset.bgsOverflow||'';delete document.body.dataset.bgsOverflow}
function openSearch(){const overlay=ensureSearchUI();overlay.hidden=false;document.body.dataset.bgsOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';const input=overlay.querySelector('#betaGlobalSearchInput');input.value='';renderSearch();setTimeout(()=>input.focus(),60)}

function currentCalendarMonth(){
  const title=document.querySelector('.calendar-title');if(!title)return null;
  const clone=title.cloneNode(true);clone.querySelectorAll('.hb-native-date-trigger').forEach(node=>node.remove());
  const match=norm(clone.textContent||'').match(/([a-z]+)\s+(\d{4})/i);if(!match)return null;
  const month=MONTHS.indexOf(match[1]);return month<0?null:{year:Number(match[2]),month};
}
function focusCalendarDate(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return;
  const [year,month]=date.split('-').map(Number),wantedMonth=month-1;
  const run=()=>{
    const current=currentCalendarMonth();if(!current)return;
    const delta=(year-current.year)*12+(wantedMonth-current.month);
    const finish=()=>setTimeout(()=>{const day=document.querySelector(`#monthGrid .day[data-day="${CSS.escape(date)}"],.month-grid .day[data-day="${CSS.escape(date)}"]`);if(day){day.click();day.scrollIntoView({block:'center',behavior:'smooth'})}},80);
    if(!delta){finish();return}
    const buttons=document.querySelectorAll('.calendar-top>button');const button=delta>0?buttons[buttons.length-1]:buttons[0];if(!button)return;
    let remaining=Math.min(Math.abs(delta),2400);const step=()=>{const amount=Math.min(remaining,12);for(let i=0;i<amount;i++)button.click();remaining-=amount;if(remaining>0)requestAnimationFrame(step);else finish()};requestAnimationFrame(step);
  };
  setTimeout(run,80);
}
function focusMatchingRow(title){
  const wanted=norm(title);if(!wanted)return;
  setTimeout(()=>{const candidates=[...document.querySelectorAll('.event-row,.task-row,.profile-doc,.expiry-day-row')];const row=candidates.find(node=>norm(node.textContent).includes(wanted));if(row){row.scrollIntoView({block:'center',behavior:'smooth'});row.animate?.([{background:'rgba(111,88,201,.18)'},{background:'transparent'}],{duration:1300})}},120);
}
function navigateResult(button){
  const target=button.dataset.target||'calendarPage',date=button.dataset.date||'',title=button.dataset.title||'';
  closeSearch();
  const nav=document.querySelector(`.bottom-nav [data-page="${target}"]`);nav?.click();
  if(target==='calendarPage'&&date)focusCalendarDate(date);else focusMatchingRow(title);
}
function ensureSearchStyles(){
  if(document.getElementById('betaGlobalSearchStyles'))return;
  const style=document.createElement('style');style.id='betaGlobalSearchStyles';style.textContent=`#betaGlobalSearchButton{display:grid;place-items:center}#betaGlobalSearchButton svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;pointer-events:none}#betaGlobalSearchOverlay[hidden]{display:none!important}#betaGlobalSearchOverlay{position:fixed;inset:0;z-index:4900;background:rgba(238,246,253,.98);padding:calc(14px + env(safe-area-inset-top)) 14px calc(92px + env(safe-area-inset-bottom));overflow:auto}.bgs-shell{width:min(680px,100%);margin:0 auto}.bgs-head{display:flex;align-items:center;gap:9px;position:sticky;top:0;z-index:2;padding-bottom:10px;background:rgba(238,246,253,.96)}#betaGlobalSearchInput{flex:1;min-width:0;border:1px solid rgba(93,112,130,.18);border-radius:15px;padding:13px 14px;background:#fff;font-size:16px;box-shadow:0 8px 24px rgba(45,94,139,.08)}.bgs-close{border:0;border-radius:13px;padding:12px 13px;background:#e6ebef;color:#273746;font-weight:850}.bgs-sub{display:flex;justify-content:space-between;align-items:center;color:#718090;font-size:11px;margin:3px 2px 10px}.bgs-results{display:grid;gap:8px}.bgs-result{width:100%;display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid rgba(93,112,130,.12);border-radius:15px;background:#fff;box-shadow:0 8px 22px rgba(45,94,139,.06);text-align:left;color:inherit}.bgs-result:active{transform:scale(.995);background:#f9fbfd}.bgs-type{flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:900;letter-spacing:.2px;background:#eef1f4;color:#566575}.bgs-type.event{background:#eaf3fb;color:#346c9d}.bgs-type.task{background:#f5efff;color:#7053a8}.bgs-type.roster{background:#e9f7ef;color:#397a58}.bgs-type.expiry{background:#fff0df;color:#a45a13}.bgs-copy{display:block;min-width:0;flex:1}.bgs-copy strong{display:block;font-size:14px;color:#182230}.bgs-date{display:block;margin-top:2px;font-size:11px;color:#657586}.bgs-meta{display:block;margin-top:3px;font-size:11px;line-height:1.3;color:#7a8794;white-space:normal}.bgs-arrow{align-self:center;font-size:25px;line-height:1;color:#9aa5af}.bgs-empty{padding:30px 16px;text-align:center;color:#738292;font-size:13px}`;
  document.head.appendChild(style);
}
function ensureSearchUI(){
  ensureSearchStyles();
  let button=document.getElementById('betaGlobalSearchButton');
  if(!button){button=document.createElement('button');button.id='betaGlobalSearchButton';button.type='button';button.className='icon-btn';button.setAttribute('aria-label','Buscar en Homebase');button.title='Buscar';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>';button.addEventListener('click',openSearch)}
  const actions=document.querySelector('.top-actions');if(actions&&!button.isConnected)actions.insertBefore(button,actions.firstChild);else if(actions&&button.parentElement!==actions)actions.insertBefore(button,actions.firstChild);
  let overlay=document.getElementById('betaGlobalSearchOverlay');
  if(!overlay){overlay=document.createElement('div');overlay.id='betaGlobalSearchOverlay';overlay.hidden=true;overlay.innerHTML='<div class="bgs-shell"><div class="bgs-head"><input id="betaGlobalSearchInput" type="search" inputmode="search" autocomplete="off" placeholder="Buscar eventos, tareas, roster…"><button type="button" class="bgs-close">Cerrar</button></div><div class="bgs-sub"><span>Busca también vencimientos</span><span id="betaGlobalSearchCount"></span></div><div id="betaGlobalSearchResults" class="bgs-results"></div></div>';document.body.appendChild(overlay);overlay.querySelector('.bgs-close').addEventListener('click',closeSearch);overlay.querySelector('#betaGlobalSearchInput').addEventListener('input',renderSearch);overlay.querySelector('#betaGlobalSearchResults').addEventListener('click',event=>{const result=event.target.closest('.bgs-result');if(result)navigateResult(result)})}
  return overlay;
}

function apply(){renameMoreToManagement();hidePendingHeroNewButton();keepGlobalQuickAddVisible();ensureSearchUI()}
function applyAfterNavigation(){requestAnimationFrame(()=>requestAnimationFrame(apply));setTimeout(apply,120)}
function install(){apply();document.addEventListener('click',event=>{if(event.target.closest('.bottom-nav [data-page]')){closeSearch();applyAfterNavigation()}},true);window.addEventListener('pageshow',applyAfterNavigation);document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAfterNavigation()});document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSearch()})}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_NAVIGATION_UX={version:VERSION,apply,openSearch,closeSearch,search:searchRows};
})();
