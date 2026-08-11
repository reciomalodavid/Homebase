(()=>{
'use strict';
const VERSION='1';
const CORE_TOMBS='homebase_core_tombstones_v1';
let selectionMode=false;
let decorating=false;
let decorateQueued=false;
const selected=new Set();

const readJson=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'');return v??fallback}catch{return fallback}};
const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const readTombs=()=>{const v=readJson(CORE_TOMBS,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
const writeTombs=v=>writeJson(CORE_TOMBS,v);
const deletedItems=()=>typeof state!=='undefined'&&Array.isArray(state.items)?state.items.filter(i=>i?.deletedAt):[];
const stamp=item=>Number(item?.updatedAt||item?.deletedAt||item?.createdAt||0)||0;
const coreItems=()=>typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[];

function normalizeTombs(items,tombs){
 const next={...(tombs||{})};
 for(const item of items||[]){
  if(!item?.id)continue;
  const id=String(item.id),ts=Number(next[id]||0),s=stamp(item);
  if(item.deletedAt){next[id]=Math.max(ts,Number(item.deletedAt||s||Date.now()));continue}
  if(ts&&s>ts)delete next[id];
 }
 return next;
}
function mergeCore(localItems,remoteItems,tombs){
 const map=new Map();
 const put=item=>{if(!item?.id)return;const id=String(item.id),prev=map.get(id),s=stamp(item),ps=stamp(prev);if(!prev||s>ps||(s===ps&&!!item.deletedAt&&!prev.deletedAt))map.set(id,item)};
 for(const item of localItems||[])put(item);
 for(const item of remoteItems||[])put(item);
 const out=[];
 for(const item of map.values()){
  const id=String(item.id),ts=Number(tombs?.[id]||0),s=stamp(item);
  if(ts>s)continue;
  if(ts===s&&!item.deletedAt)out.push({...item,deletedAt:ts,updatedAt:Math.max(s,ts)});else out.push(item);
 }
 return out;
}
function collectTombs(){const next=normalizeTombs(coreItems(),readTombs());writeTombs(next);return next}
function recordPermanentDelete(id){
 id=String(id||'');if(!id)return;
 const item=coreItems().find(x=>String(x?.id||'')===id),tombs=readTombs();
 tombs[id]=Math.max(Number(tombs[id]||0),Date.now(),stamp(item)+1);writeTombs(tombs);
}
function persistAndSync(){
 try{localStorage.setItem('homebase_v2_items',JSON.stringify(state.items))}catch{}
 try{if(typeof render==='function')render()}catch{}
 try{if(typeof renderTrash==='function')renderTrash()}catch{}
 try{if(typeof bindDynamic==='function')bindDynamic()}catch{}
 try{if(typeof scheduleCloudSave==='function')scheduleCloudSave()}catch{}
}
function permanentlyDelete(ids){
 const unique=[...new Set((ids||[]).map(String).filter(Boolean))];if(!unique.length)return false;
 const set=new Set(unique),tombs=readTombs(),now=Date.now();
 for(const id of unique){const item=state.items.find(x=>String(x?.id||'')===id);tombs[id]=Math.max(Number(tombs[id]||0),now,stamp(item)+1)}
 writeTombs(tombs);state.items=state.items.filter(item=>!set.has(String(item?.id||'')));for(const id of unique)selected.delete(id);persistAndSync();return true;
}
function restoreItem(id){
 id=String(id||'');if(!id)return false;const item=coreItems().find(x=>String(x?.id||'')===id);if(!item)return false;
 const now=Date.now();item.deletedAt=null;item.updatedAt=now;const tombs=readTombs();delete tombs[id];writeTombs(tombs);persistAndSync();return true;
}
function patchSyncIntegrity(){
 if(typeof mergeItems==='function'&&!mergeItems.__productionTrashV1){const wrapped=function(localItems,remoteItems){const tombs=normalizeTombs([...(localItems||[]),...(remoteItems||[])],readTombs());writeTombs(tombs);return mergeCore(localItems,remoteItems,tombs)};wrapped.__productionTrashV1=true;mergeItems=wrapped}
 if(typeof cloudPayload==='function'&&!cloudPayload.__productionTrashV1){const original=cloudPayload;const wrapped=function(){const payload=original();const tombs=collectTombs();payload.items=mergeCore([],coreItems(),tombs);payload.coreTombstonesV1=tombs;return payload};wrapped.__productionTrashV1=true;cloudPayload=wrapped}
 if(typeof applyRemotePayload==='function'&&!applyRemotePayload.__productionTrashV1){const original=applyRemotePayload;const wrapped=function(data){const remote=data?.coreTombstonesV1&&typeof data.coreTombstonesV1==='object'?data.coreTombstonesV1:{};let tombs={...remote};for(const [id,ts] of Object.entries(readTombs()))tombs[id]=Math.max(Number(tombs[id]||0),Number(ts||0));tombs=normalizeTombs([...(coreItems()||[]),...(data?.items||[])],tombs);writeTombs(tombs);const patched={...data,items:mergeCore(coreItems(),data?.items||[],tombs)};original(patched);if(Array.isArray(state?.items))state.items=mergeCore([],state.items,tombs)};wrapped.__productionTrashV1=true;applyRemotePayload=wrapped}
}
function updateToolbar(){
 const dialog=document.getElementById('trashDialog');if(!dialog)return;
 const selectBtn=dialog.querySelector('#productionTrashSelect'),deleteBtn=dialog.querySelector('#productionTrashDeleteSelected'),emptyBtn=dialog.querySelector('#productionTrashEmpty');
 if(selectBtn)selectBtn.textContent=selectionMode?'Cancelar':'Seleccionar';
 if(deleteBtn){deleteBtn.hidden=!selectionMode;deleteBtn.disabled=selected.size===0;deleteBtn.textContent=selected.size?`Eliminar seleccionados (${selected.size})`:'Eliminar seleccionados'}
 if(emptyBtn)emptyBtn.disabled=deletedItems().length===0;
}
function toggleSelected(id){id=String(id||'');if(!id)return;selected.has(id)?selected.delete(id):selected.add(id);decorateRows()}
function decorateRows(){
 if(decorating)return;const list=document.getElementById('trashList');if(!list)return;decorating=true;
 try{
  list.classList.toggle('production-trash-selecting',selectionMode);
  list.querySelectorAll('.trash-item').forEach(row=>{
   const restore=row.querySelector('[data-restore]'),id=String(restore?.dataset.restore||row.dataset.trashOpen||'');if(!id)return;
   let pick=row.querySelector('.production-trash-pick');if(!pick){pick=document.createElement('button');pick.type='button';pick.className='production-trash-pick';pick.setAttribute('aria-label','Seleccionar elemento');pick.dataset.id=id;pick.onclick=e=>{e.preventDefault();e.stopPropagation();toggleSelected(id)};row.prepend(pick)}
   const on=selected.has(id);pick.dataset.id=id;pick.textContent=on?'✓':'';pick.classList.toggle('selected',on);pick.hidden=!selectionMode;row.classList.toggle('production-trash-selected',selectionMode&&on);
  });updateToolbar();
 }finally{decorating=false}
}
function queueDecorate(){if(decorateQueued)return;decorateQueued=true;requestAnimationFrame(()=>{decorateQueued=false;decorateRows()})}
function toggleSelection(){selectionMode=!selectionMode;if(!selectionMode)selected.clear();decorateRows()}
function deleteSelected(){if(!selected.size)return;const count=selected.size;if(!confirm(`¿Eliminar definitivamente ${count} elemento${count===1?'':'s'}? Esta acción no se puede deshacer.`))return;permanentlyDelete([...selected]);selectionMode=false;selected.clear();queueDecorate()}
function emptyTrash(){const items=deletedItems();if(!items.length)return;const count=items.length;if(!confirm(`¿Vaciar la papelera? Se eliminarán definitivamente ${count} elemento${count===1?'':'s'} y no se podrán recuperar.`))return;permanentlyDelete(items.map(i=>i.id));selectionMode=false;selected.clear();queueDecorate()}
function installUi(){
 const dialog=document.getElementById('trashDialog'),list=document.getElementById('trashList');if(!dialog||!list)return false;
 if(!dialog.querySelector('#productionTrashToolbar')){const toolbar=document.createElement('div');toolbar.id='productionTrashToolbar';toolbar.className='production-trash-toolbar';toolbar.innerHTML='<button type="button" id="productionTrashSelect" class="production-trash-neutral">Seleccionar</button><button type="button" id="productionTrashDeleteSelected" class="production-trash-danger" hidden>Eliminar seleccionados</button><button type="button" id="productionTrashEmpty" class="production-trash-danger-outline">Vaciar papelera</button>';const intro=dialog.querySelector('.modal > .event-meta');if(intro)intro.insertAdjacentElement('afterend',toolbar);else list.before(toolbar);dialog.querySelector('#productionTrashSelect').onclick=toggleSelection;dialog.querySelector('#productionTrashDeleteSelected').onclick=deleteSelected;dialog.querySelector('#productionTrashEmpty').onclick=emptyTrash}
 if(!document.getElementById('productionTrashToolsStyle')){const style=document.createElement('style');style.id='productionTrashToolsStyle';style.textContent=`.production-trash-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}.production-trash-toolbar button{border:0;border-radius:11px;padding:9px 11px;font-size:12px;font-weight:800}.production-trash-neutral{background:var(--surface-2);color:var(--text)}.production-trash-danger{background:#fff0f1;color:var(--danger)}.production-trash-danger-outline{background:transparent;color:var(--danger);border:1px solid rgba(216,74,85,.28)!important}.production-trash-toolbar button:disabled{opacity:.42}.production-trash-pick{flex:0 0 28px;width:28px;height:28px;border-radius:9px;border:2px solid #c8ced5;background:#fff;font-weight:900;color:#fff;margin-right:3px}.production-trash-pick.selected{background:var(--accent);border-color:var(--accent)}.trash-item:has(.production-trash-pick:not([hidden])){grid-template-columns:32px 1fr auto}.production-trash-selected{outline:2px solid color-mix(in srgb,var(--accent) 35%,transparent)}@media(max-width:540px){.production-trash-toolbar{display:grid;grid-template-columns:1fr 1fr}.production-trash-toolbar #productionTrashDeleteSelected{grid-column:1/-1}.trash-item:has(.production-trash-pick:not([hidden])){grid-template-columns:30px 1fr}.trash-item:has(.production-trash-pick:not([hidden])) .trash-actions{grid-column:2}}`;document.head.appendChild(style)}
 if(!list.__productionTrashObserver){const observer=new MutationObserver(mutations=>{if(decorating)return;const external=mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>!(n.nodeType===1&&n.classList?.contains('production-trash-pick'))));if(external)queueDecorate()});observer.observe(list,{childList:true});list.__productionTrashObserver=observer}
 decorateRows();return true;
}
function install(){
 let tries=0;const run=()=>{tries++;patchSyncIntegrity();if(!installUi()&&tries<80)setTimeout(run,100);else if(tries<80&&(!mergeItems?.__productionTrashV1||!cloudPayload?.__productionTrashV1||!applyRemotePayload?.__productionTrashV1))setTimeout(run,100)};run();
 document.addEventListener('click',event=>{const restore=event.target.closest?.('[data-restore]');if(restore){event.preventDefault();event.stopImmediatePropagation();restoreItem(restore.dataset.restore);return}const detail=event.target.closest?.('#restoreFromTrashDetail');if(detail){event.preventDefault();event.stopImmediatePropagation();const id=String(state?.trashDetailId||'');if(restoreItem(id)){try{document.getElementById('trashDetailDialog')?.close()}catch{}}return}const permanent=event.target.closest?.('[data-permanent]');if(permanent)recordPermanentDelete(permanent.dataset.permanent)},true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){collectTombs();try{if(typeof scheduleCloudSave==='function')scheduleCloudSave()}catch{}}});
 window.addEventListener('pageshow',()=>{collectTombs()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_TRASH_TOOLS={version:VERSION,empty:emptyTrash,deleteSelected:permanentlyDelete,restore:restoreItem};
})();