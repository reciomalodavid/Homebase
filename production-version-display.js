(()=>{
'use strict';

function hasNotes(item){
 const value=item?.notes??item?.note??item?.description??'';
 return String(value||'').trim().length>0;
}
function itemId(item){return String(item?.id||item?.uuid||'')}
function allItems(){return typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]}
function eventCandidates(){return allItems().filter(i=>i&&!i.deletedAt&&i.source!=='roster'&&i.type!=='task'&&hasNotes(i))}
function rowItem(row){
 const candidates=eventCandidates();
 if(!candidates.length)return null;
 const direct=String(row?.dataset?.itemId||row?.dataset?.id||row?.getAttribute?.('data-item-id')||row?.getAttribute?.('data-id')||'');
 if(direct){const found=candidates.find(i=>itemId(i)===direct);if(found)return found}
 const title=String(row?.querySelector?.('.event-title')?.textContent||'').trim();
 if(title){const exact=candidates.filter(i=>String(i?.title||'').trim()===title);if(exact.length===1)return exact[0]}
 return null;
}
function ensureNotesStyles(){
 if(document.getElementById('homebaseNotesIndicatorStyles'))return;
 const style=document.createElement('style');style.id='homebaseNotesIndicatorStyles';style.textContent=`
 .hb-notes-indicator{display:inline-flex;align-items:center;gap:4px;margin-top:5px;padding:2px 7px;border-radius:999px;background:rgba(217,120,31,.10);color:#a95d17;font-size:10px;font-weight:800;line-height:1.25;white-space:nowrap}
 .hb-notes-indicator::before{content:'📝';font-size:10px;line-height:1}
 .event-row .hb-notes-indicator{width:max-content}
 `;document.head.appendChild(style)
}
function decorateNotes(){
 ensureNotesStyles();
 for(const row of document.querySelectorAll('.event-row')){
  const existing=row.querySelector('.hb-notes-indicator');
  const item=rowItem(row);
  if(!item){existing?.remove();continue}
  if(existing)continue;
  const meta=row.querySelector('.event-meta')||row.querySelector('.event-title')?.parentElement;
  if(!meta)continue;
  const badge=document.createElement('span');badge.className='hb-notes-indicator';badge.textContent='Notas';badge.setAttribute('aria-label','Este evento tiene notas');
  meta.insertAdjacentElement('afterend',badge);
 }
}
async function apply(){
 try{
  const response=await fetch(`./homebase-version.json?t=${Date.now()}`,{cache:'no-store'});if(response.ok){const data=await response.json();const el=document.getElementById('productionAppVersion');if(el)el.textContent=`Homebase ${data.version||'?'} · build ${data.build||'?'}`}
 }catch{}
 decorateNotes();
}
function start(){
 apply();setTimeout(apply,500);setTimeout(decorateNotes,1200);
 const observer=new MutationObserver(()=>{clearTimeout(window.__hbNotesTimer);window.__hbNotesTimer=setTimeout(decorateNotes,60)});
 observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',decorateNotes);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)decorateNotes()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_VERSION_DISPLAY={apply,decorateNotes};
})();