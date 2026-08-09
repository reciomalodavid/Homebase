(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='3';
const CORE_TOMBS='homebase_beta_core_tombstones_v1';
let selectionMode=false;
let decorating=false;
let decorateQueued=false;
const selected=new Set();

const readTombs=()=>{try{const v=JSON.parse(localStorage.getItem(CORE_TOMBS)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const writeTombs=v=>localStorage.setItem(CORE_TOMBS,JSON.stringify(v));
const deletedItems=()=>typeof state!=='undefined'&&Array.isArray(state.items)?state.items.filter(i=>i?.deletedAt):[];
const stamp=item=>Number(item?.updatedAt||item?.deletedAt||item?.createdAt||0)||0;

function persistAndSync(){
  try{localStorage.setItem('homebase_v2_items',JSON.stringify(state.items))}catch{}
  try{if(typeof render==='function')render()}catch{}
  try{if(typeof renderTrash==='function')renderTrash()}catch{}
  try{if(typeof bindDynamic==='function')bindDynamic()}catch{}
  try{if(typeof scheduleCloudSave==='function')scheduleCloudSave()}catch{}
}

function permanentlyDelete(ids){
  const unique=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!unique.length)return false;
  const idSet=new Set(unique),tombs=readTombs(),now=Date.now();
  for(const id of unique){
    const item=state.items.find(x=>String(x?.id||'')===id);
    tombs[id]=Math.max(Number(tombs[id]||0),now,stamp(item)+1);
  }
  writeTombs(tombs);
  state.items=state.items.filter(item=>!idSet.has(String(item?.id||'')));
  for(const id of unique)selected.delete(id);
  persistAndSync();
  return true;
}

function updateToolbar(){
  const dialog=document.getElementById('trashDialog');
  if(!dialog)return;
  const selectBtn=dialog.querySelector('#betaTrashSelect');
  const deleteBtn=dialog.querySelector('#betaTrashDeleteSelected');
  const emptyBtn=dialog.querySelector('#betaTrashEmpty');
  if(selectBtn)selectBtn.textContent=selectionMode?'Cancelar':'Seleccionar';
  if(deleteBtn){
    deleteBtn.hidden=!selectionMode;
    deleteBtn.disabled=selected.size===0;
    deleteBtn.textContent=selected.size?`Eliminar seleccionados (${selected.size})`:'Eliminar seleccionados';
  }
  if(emptyBtn)emptyBtn.disabled=deletedItems().length===0;
}

function decorateRows(){
  if(decorating)return;
  const list=document.getElementById('trashList');
  if(!list)return;
  decorating=true;
  try{
    list.classList.toggle('beta-trash-selecting',selectionMode);
    list.querySelectorAll('.trash-item').forEach(row=>{
      const restore=row.querySelector('[data-restore]');
      const id=String(restore?.dataset.restore||row.dataset.trashOpen||'');
      if(!id)return;
      let pick=row.querySelector('.beta-trash-pick');
      if(!pick){
        pick=document.createElement('button');
        pick.type='button';
        pick.className='beta-trash-pick';
        pick.setAttribute('aria-label','Seleccionar elemento');
        pick.dataset.id=id;
        pick.onclick=e=>{e.preventDefault();e.stopPropagation();toggleSelected(id)};
        row.prepend(pick);
      }
      const isSelected=selected.has(id);
      if(pick.dataset.id!==id)pick.dataset.id=id;
      const wantedText=isSelected?'✓':'';
      if(pick.textContent!==wantedText)pick.textContent=wantedText;
      pick.classList.toggle('selected',isSelected);
      pick.hidden=!selectionMode;
      row.classList.toggle('beta-trash-selected',selectionMode&&isSelected);
    });
    updateToolbar();
  }finally{decorating=false;}
}

function queueDecorate(){
  if(decorateQueued)return;
  decorateQueued=true;
  requestAnimationFrame(()=>{decorateQueued=false;decorateRows()});
}

function toggleSelected(id){
  id=String(id||'');if(!id)return;
  selected.has(id)?selected.delete(id):selected.add(id);
  decorateRows();
}

function toggleSelection(){
  selectionMode=!selectionMode;
  if(!selectionMode)selected.clear();
  decorateRows();
}

function deleteSelected(){
  if(!selected.size)return;
  const count=selected.size;
  if(!confirm(`¿Eliminar definitivamente ${count} elemento${count===1?'':'s'}? Esta acción no se puede deshacer.`))return;
  permanentlyDelete([...selected]);
  selectionMode=false;selected.clear();
  queueDecorate();
}

function emptyTrash(){
  const items=deletedItems();
  if(!items.length)return;
  const count=items.length;
  if(!confirm(`¿Vaciar la papelera? Se eliminarán definitivamente ${count} elemento${count===1?'':'s'} y no se podrán recuperar.`))return;
  permanentlyDelete(items.map(i=>i.id));
  selectionMode=false;selected.clear();
  queueDecorate();
}

function installUi(){
  const dialog=document.getElementById('trashDialog');
  const list=document.getElementById('trashList');
  if(!dialog||!list)return false;
  if(!dialog.querySelector('#betaTrashToolbar')){
    const toolbar=document.createElement('div');
    toolbar.id='betaTrashToolbar';
    toolbar.className='beta-trash-toolbar';
    toolbar.innerHTML='<button type="button" id="betaTrashSelect" class="beta-trash-neutral">Seleccionar</button><button type="button" id="betaTrashDeleteSelected" class="beta-trash-danger" hidden>Eliminar seleccionados</button><button type="button" id="betaTrashEmpty" class="beta-trash-danger-outline">Vaciar papelera</button>';
    const intro=dialog.querySelector('.modal > .event-meta');
    if(intro)intro.insertAdjacentElement('afterend',toolbar);else list.before(toolbar);
    dialog.querySelector('#betaTrashSelect').onclick=toggleSelection;
    dialog.querySelector('#betaTrashDeleteSelected').onclick=deleteSelected;
    dialog.querySelector('#betaTrashEmpty').onclick=emptyTrash;
  }
  if(!document.getElementById('betaTrashToolsStyle')){
    const style=document.createElement('style');style.id='betaTrashToolsStyle';
    style.textContent=`.beta-trash-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}.beta-trash-toolbar button{border:0;border-radius:11px;padding:9px 11px;font-size:12px;font-weight:800}.beta-trash-neutral{background:var(--surface-2);color:var(--text)}.beta-trash-danger{background:#fff0f1;color:var(--danger)}.beta-trash-danger-outline{background:transparent;color:var(--danger);border:1px solid rgba(216,74,85,.28)!important}.beta-trash-toolbar button:disabled{opacity:.42}.beta-trash-pick{flex:0 0 28px;width:28px;height:28px;border-radius:9px;border:2px solid #c8ced5;background:#fff;font-weight:900;color:#fff;margin-right:3px}.beta-trash-pick.selected{background:var(--accent);border-color:var(--accent)}.trash-item:has(.beta-trash-pick:not([hidden])){grid-template-columns:32px 1fr auto}.beta-trash-selected{outline:2px solid color-mix(in srgb,var(--accent) 35%,transparent)}@media(max-width:540px){.beta-trash-toolbar{display:grid;grid-template-columns:1fr 1fr}.beta-trash-toolbar #betaTrashDeleteSelected{grid-column:1/-1}.trash-item:has(.beta-trash-pick:not([hidden])){grid-template-columns:30px 1fr}.trash-item:has(.beta-trash-pick:not([hidden])) .trash-actions{grid-column:2}}`;
    document.head.appendChild(style);
  }
  if(!list.__betaTrashObserver){
    const observer=new MutationObserver(mutations=>{
      if(decorating)return;
      const externalChange=mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>!(n.nodeType===1&&n.classList?.contains('beta-trash-pick'))));
      if(externalChange)queueDecorate();
    });
    observer.observe(list,{childList:true});
    list.__betaTrashObserver=observer;
  }
  decorateRows();return true;
}

function install(){let tries=0;const run=()=>{tries++;if(!installUi()&&tries<80)setTimeout(run,100)};run();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_TRASH_TOOLS={version:VERSION,empty:emptyTrash,deleteSelected:permanentlyDelete};
})();
