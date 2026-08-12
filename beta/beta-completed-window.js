(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
const WINDOW_DAYS=10;
let showArchive=false;

function completedStamp(item){
 const direct=Number(item?.completedAt||item?.updatedAt||0);
 if(direct)return direct;
 const date=String(item?.date||'');
 if(date){const ms=new Date(`${date}T12:00:00`).getTime();if(Number.isFinite(ms))return ms}
 return 0;
}
function ensureArchive(total,recent){
 const list=document.getElementById('doneList');if(!list)return;
 const archived=total-recent;
 let wrap=document.getElementById('betaDoneArchive');
 if(archived<=0){wrap?.remove();return}
 if(!wrap){
   wrap=document.createElement('div');wrap.id='betaDoneArchive';wrap.style.cssText='margin-top:12px';
   wrap.innerHTML='<button id="betaDoneHistoryToggle" type="button" aria-expanded="false" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(111,88,201,.18);border-radius:16px;background:rgba(255,255,255,.74);color:#3b4150;padding:12px 14px;font-size:13px;font-weight:850"><span class="label"></span><span class="chev" style="color:#6f58c9;font-size:16px">⌄</span></button><div id="betaDoneArchiveList" hidden style="margin-top:8px"></div>';
   list.insertAdjacentElement('afterend',wrap);
   wrap.querySelector('button').onclick=()=>{showArchive=!showArchive;renderTasks()};
 }
 const btn=wrap.querySelector('#betaDoneHistoryToggle');
 btn.setAttribute('aria-expanded',String(showArchive));
 btn.querySelector('.label').textContent=`Anteriores a 10 días (${archived})`;
 btn.querySelector('.chev').textContent=showArchive?'⌃':'⌄';
 const archiveList=wrap.querySelector('#betaDoneArchiveList');
 archiveList.hidden=!showArchive;
}
function patch(){
 if(typeof renderTasks!=='function')return false;
 if(renderTasks.__betaCompletedWindow)return true;
 const wrapped=function(){
   const all=tasksVisible();
   const pending=all.filter(i=>!i.done).sort((a,b)=>{
     if(!a.date&&!b.date)return 0;
     if(!a.date)return 1;
     if(!b.date)return -1;
     return a.date.localeCompare(b.date);
   });
   const doneAll=all.filter(i=>i.done).sort((a,b)=>(completedStamp(b)||0)-(completedStamp(a)||0));
   const cutoff=Date.now()-WINDOW_DAYS*24*60*60*1000;
   const recent=doneAll.filter(item=>completedStamp(item)>=cutoff);
   const archive=doneAll.filter(item=>completedStamp(item)<cutoff);
   fillList(document.getElementById('taskList'),pending.map(taskRow).join(''),'No hay pendientes','Todo está hecho.');
   fillList(document.getElementById('doneList'),recent.map(taskRow).join(''),'No hay completadas recientes','Las tareas completadas en los últimos 10 días aparecerán aquí.');
   document.getElementById('taskCount').textContent=`${pending.length}`;
   document.getElementById('doneCount').textContent=`${recent.length} recientes`;
   ensureArchive(doneAll.length,recent.length);
   const archiveList=document.getElementById('betaDoneArchiveList');
   if(archiveList){
     archiveList.hidden=!showArchive;
     archiveList.innerHTML=showArchive?archive.map(taskRow).join(''):'';
   }
 };
 wrapped.__betaCompletedWindow=true;
 renderTasks=wrapped;
 return true;
}
function install(){let tries=0;const run=()=>{tries++;if(patch()){try{renderTasks()}catch{}}else if(tries<80)setTimeout(run,100)};run()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_COMPLETED_WINDOW={version:VERSION,showArchive:()=>{showArchive=true;renderTasks()},hideArchive:()=>{showArchive=false;renderTasks()}};
})();
