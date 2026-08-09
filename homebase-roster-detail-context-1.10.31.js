(()=>{
'use strict';

const VERSION='1.10.31';
function fold(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase()}
function currentRosterItem(){
  if(typeof state==='undefined'||!state?.detailId||!Array.isArray(state.items))return null;
  const item=state.items.find(i=>i.id===state.detailId);
  return item?.source==='roster'?item:null;
}
function removeRows(labels){
  const wanted=new Set(labels.map(fold));
  const grid=document.getElementById('detailGrid');
  if(!grid)return;
  for(const row of [...grid.querySelectorAll('.detail-row')]){
    const label=fold(row.querySelector('.detail-label')?.textContent);
    if(wanted.has(label))row.remove();
  }
}
function cleanRosterDetail(){
  const grid=document.getElementById('detailGrid');
  const dialog=document.getElementById('detailDialog');
  if(!grid||!dialog?.open)return;
  const item=currentRosterItem();
  if(!item)return;
  const r=item.rosterData||{},kind=String(r.kind||'').toLowerCase();
  removeRows(['Privacidad']);
  if(kind==='off'||kind==='vacation'){
    removeRows(['Horario','Standby previo','Recogida','Briefing','C/I','Trayecto del duty','C/O','Debriefing','Noche fuera']);
  }else if(kind==='standby'){
    removeRows(['Trayecto del duty','Noche fuera']);
    const hasOperationalTime=!!(r.startLocal||r.ciLocal||r.coLocal||item.time||item.endTime);
    if(!hasOperationalTime)removeRows(['Horario']);
  }else if(kind==='training'||kind==='ground'){
    removeRows(['Noche fuera']);
    const hasOperationalTime=!!(r.startLocal||r.ciLocal||r.coLocal||item.time||item.endTime);
    if(!hasOperationalTime)removeRows(['Horario']);
  }
}
function install(){
  const grid=document.getElementById('detailGrid'),dialog=document.getElementById('detailDialog');
  if(!grid||!dialog){setTimeout(install,250);return}
  new MutationObserver(()=>setTimeout(cleanRosterDetail,0)).observe(grid,{childList:true,subtree:true,characterData:true});
  dialog.addEventListener('toggle',()=>setTimeout(cleanRosterDetail,0));
  document.addEventListener('click',()=>setTimeout(cleanRosterDetail,0),true);
  setTimeout(cleanRosterDetail,200);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_ROSTER_DETAIL_CONTEXT={version:VERSION,refresh:cleanRosterDetail};
})();