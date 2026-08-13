(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='5',WINDOW_DAYS=10;
let showArchive=false,rendering=false;

function completedStamp(item){
 const direct=Number(item?.completedAt||0);
 if(direct)return direct;
 const date=String(item?.date||'');
 if(date){const ms=new Date(`${date}T12:00:00`).getTime();if(Number.isFinite(ms))return ms}
 return 0;
}
function ensureArchive(archive){
 const list=document.getElementById('doneList');if(!list)return;
 let wrap=document.getElementById('betaDoneArchive');
 if(!wrap){
   wrap=document.createElement('div');wrap.id='betaDoneArchive';wrap.style.cssText='margin-top:12px';
   wrap.innerHTML='<button id="betaDoneHistoryToggle" type="button" aria-expanded="false" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(111,88,201,.18);border-radius:16px;background:rgba(255,255,255,.74);color:#3b4150;padding:12px 14px;font-size:13px;font-weight:850"><span class="label"></span><span class="chev" style="color:#6f58c9;font-size:16px">⌄</span></button><div id="betaDoneArchiveList" hidden style="margin-top:8px"></div>';
   list.insertAdjacentElement('afterend',wrap);
   wrap.querySelector('button').onclick=()=>{if(!archive.length)return;showArchive=!showArchive;renderCompletedWindow()};
 }
 const btn=wrap.querySelector('#betaDoneHistoryToggle');
 btn.disabled=!archive.length;btn.style.opacity=archive.length?'1':'.62';
 btn.setAttribute('aria-expanded',String(showArchive&&archive.length));
 btn.querySelector('.label').textContent=`Anteriores a 10 días (${archive.length})`;
 btn.querySelector('.chev').textContent=showArchive&&archive.length?'⌃':'⌄';
 const archiveList=wrap.querySelector('#betaDoneArchiveList');
 archiveList.hidden=!(showArchive&&archive.length);
 archiveList.innerHTML=showArchive&&archive.length?archive.map(taskRow).join(''):'';
}
function renderCompletedWindow(){
 if(rendering||typeof tasksVisible!=='function'||typeof fillList!=='function'||typeof taskRow!=='function')return false;
 const list=document.getElementById('doneList'),count=document.getElementById('doneCount');if(!list||!count)return false;
 rendering=true;
 try{
   const doneAll=tasksVisible().filter(item=>item.done).sort((a,b)=>completedStamp(b)-completedStamp(a));
   const cutoff=Date.now()-WINDOW_DAYS*86400000;
   const recent=doneAll.filter(item=>completedStamp(item)>=cutoff);
   const archive=doneAll.filter(item=>completedStamp(item)<cutoff);
   fillList(list,recent.map(taskRow).join(''),'No hay completadas recientes','Las tareas completadas en los últimos 10 días aparecerán aquí.');
   count.textContent=`${recent.length} recientes`;
   ensureArchive(archive);
   return true;
 }finally{rendering=false}
}
function patch(){
 const current=window.renderTasks;
 if(typeof current!=='function')return false;
 if(current.__betaCompletedWindowVersion===VERSION)return true;
 const original=current.__betaCompletedWindowOriginal||current;
 const wrapped=function(){original();renderCompletedWindow()};
 wrapped.__betaCompletedWindowOriginal=original;
 wrapped.__betaCompletedWindowVersion=VERSION;
 window.renderTasks=wrapped;
 return true;
}
function install(){
 let tries=0;
 const run=()=>{tries++;if(patch()){renderCompletedWindow()}else if(tries<120)setTimeout(run,100)};
 run();
 const list=document.getElementById('doneList');
 if(list)new MutationObserver(()=>{if(!rendering)requestAnimationFrame(renderCompletedWindow)}).observe(list,{childList:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_COMPLETED_WINDOW={version:VERSION,render:renderCompletedWindow,showArchive:()=>{showArchive=true;renderCompletedWindow()},hideArchive:()=>{showArchive=false;renderCompletedWindow()}};
})();