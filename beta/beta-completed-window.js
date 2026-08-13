(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='6',WINDOW_DAYS=10;
let showArchive=false,currentArchive=[];

function parseStamp(value){
 if(value==null||value==='')return 0;
 if(typeof value==='number')return value>0&&value<1e12?value*1000:value;
 if(typeof value?.toMillis==='function'){try{return value.toMillis()}catch{}}
 if(typeof value==='object'){
   const seconds=Number(value.seconds??value._seconds);
   if(Number.isFinite(seconds)&&seconds>0)return seconds*1000;
 }
 const raw=String(value).trim();
 if(/^\d+$/.test(raw)){const number=Number(raw);return number<1e12?number*1000:number}
 const spanish=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
 if(spanish)return new Date(Number(spanish[3]),Number(spanish[2])-1,Number(spanish[1]),12).getTime();
 const isoOnly=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(isoOnly)return new Date(Number(isoOnly[1]),Number(isoOnly[2])-1,Number(isoOnly[3]),12).getTime();
 const parsed=Date.parse(raw);return Number.isFinite(parsed)?parsed:0;
}
function completedStamp(item){
 return parseStamp(item?.completedAt)||parseStamp(item?.completedDate)||parseStamp(item?.doneAt)||parseStamp(item?.finishedAt)||parseStamp(item?.date)||parseStamp(item?.updatedAt)||0;
}
function paintArchive(){
 const list=document.getElementById('doneList');if(!list)return;
 let wrap=document.getElementById('betaDoneArchive');
 if(!wrap){
   wrap=document.createElement('div');wrap.id='betaDoneArchive';wrap.style.cssText='margin-top:12px';
   wrap.innerHTML='<button id="betaDoneHistoryToggle" type="button" aria-expanded="false" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(111,88,201,.18);border-radius:16px;background:rgba(255,255,255,.74);color:#3b4150;padding:12px 14px;font-size:13px;font-weight:850"><span class="label"></span><span class="chev" style="color:#6f58c9;font-size:16px">⌄</span></button><div id="betaDoneArchiveList" hidden style="margin-top:8px"></div>';
   list.insertAdjacentElement('afterend',wrap);
   wrap.querySelector('button').addEventListener('click',()=>{if(!currentArchive.length)return;showArchive=!showArchive;paintArchive();if(showArchive&&typeof bindDynamic==='function')bindDynamic()});
 }
 const btn=wrap.querySelector('#betaDoneHistoryToggle'),archiveList=wrap.querySelector('#betaDoneArchiveList');
 btn.disabled=!currentArchive.length;btn.style.opacity=currentArchive.length?'1':'.62';
 btn.setAttribute('aria-expanded',String(showArchive&&currentArchive.length));
 btn.querySelector('.label').textContent=`Anteriores a 10 días (${currentArchive.length})`;
 btn.querySelector('.chev').textContent=showArchive&&currentArchive.length?'⌃':'⌄';
 archiveList.hidden=!(showArchive&&currentArchive.length);
 archiveList.innerHTML=showArchive&&currentArchive.length?currentArchive.map(taskRow).join(''):'';
}
function renderWindow(){
 if(typeof tasksVisible!=='function'||typeof fillList!=='function'||typeof taskRow!=='function')return false;
 const list=document.getElementById('doneList'),count=document.getElementById('doneCount');if(!list||!count)return false;
 const doneAll=tasksVisible().filter(item=>item.done).sort((a,b)=>completedStamp(b)-completedStamp(a));
 const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-WINDOW_DAYS);
 const recent=doneAll.filter(item=>completedStamp(item)>=cutoff.getTime());
 currentArchive=doneAll.filter(item=>completedStamp(item)<cutoff.getTime());
 fillList(list,recent.map(taskRow).join(''),'No hay completadas recientes','Las tareas completadas en los últimos 10 días aparecerán aquí.');
 count.textContent=`${recent.length} recientes`;
 const old=document.getElementById('betaDoneArchive');if(old)old.remove();
 paintArchive();
 return true;
}
function patch(){
 if(typeof renderTasks!=='function')return false;
 if(renderTasks.__betaCompletedWindowVersion===VERSION)return true;
 const original=renderTasks.__betaCompletedWindowOriginal||renderTasks;
 const wrapped=function(){original();renderWindow()};
 wrapped.__betaCompletedWindowOriginal=original;
 wrapped.__betaCompletedWindowVersion=VERSION;
 renderTasks=wrapped;
 return true;
}
function install(){let tries=0;const run=()=>{tries++;if(patch())renderWindow();else if(tries<120)setTimeout(run,100)};run()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_COMPLETED_WINDOW={version:VERSION,render:renderWindow,showArchive:()=>{showArchive=true;paintArchive()},hideArchive:()=>{showArchive=false;paintArchive()}};
})();