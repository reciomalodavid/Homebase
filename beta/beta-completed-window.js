(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
const WINDOW_DAYS=90;
let showAll=false;

function completedStamp(item){
 const direct=Number(item?.completedAt||item?.updatedAt||0);
 if(direct)return direct;
 const date=String(item?.date||'');
 if(date){const ms=new Date(`${date}T12:00:00`).getTime();if(Number.isFinite(ms))return ms}
 return 0;
}
function ensureToggle(total,recent){
 const list=document.getElementById('doneList');if(!list)return;
 let button=document.getElementById('betaDoneHistoryToggle');
 if(total<=recent){button?.remove();return}
 if(!button){button=document.createElement('button');button.id='betaDoneHistoryToggle';button.type='button';button.style.cssText='display:block;margin:10px auto 0;border:1px solid rgba(111,88,201,.20);border-radius:999px;background:rgba(255,255,255,.82);color:#634db7;padding:9px 13px;font-size:12px;font-weight:850';list.insertAdjacentElement('afterend',button);button.onclick=()=>{showAll=!showAll;renderTasks()}}
 button.textContent=showAll?'Mostrar solo últimos 90 días':`Ver anteriores (${total-recent})`;
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
   const doneAll=all.filter(i=>i.done).sort((a,b)=>(b.completedAt||0)-(a.completedAt||0));
   const cutoff=Date.now()-WINDOW_DAYS*24*60*60*1000;
   const recent=doneAll.filter(item=>completedStamp(item)>=cutoff);
   const visible=showAll?doneAll:recent;
   fillList(document.getElementById('taskList'),pending.map(taskRow).join(''),'No hay pendientes','Todo está hecho.');
   fillList(document.getElementById('doneList'),visible.map(taskRow).join(''),'No hay completadas','Las tareas terminadas aparecerán aquí.');
   document.getElementById('taskCount').textContent=`${pending.length}`;
   document.getElementById('doneCount').textContent=showAll?`${doneAll.length}`:`${recent.length} recientes`;
   ensureToggle(doneAll.length,recent.length);
 };
 wrapped.__betaCompletedWindow=true;
 renderTasks=wrapped;
 return true;
}
function install(){let tries=0;const run=()=>{tries++;if(patch()){try{renderTasks()}catch{}}else if(tries<80)setTimeout(run,100)};run()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_COMPLETED_WINDOW={version:VERSION,showAll:()=>{showAll=true;renderTasks()},showRecent:()=>{showAll=false;renderTasks()}};
})();
