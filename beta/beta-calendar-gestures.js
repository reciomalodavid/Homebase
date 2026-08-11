(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='6';
const LONG_PRESS_MS=560;
const SWIPE_PX=58;
const MOVE_TOLERANCE=12;
const OPEN_DELAY_MS=260;

let active=null;
let longTimer=null;
let suppressClickUntil=0;
let suppressAllClickUntil=0;

function grid(){return document.getElementById('monthGrid')||document.querySelector('.month-grid')}
function dayFrom(target){return target?.closest?.('.day[data-day]')||null}
function monthButtons(){return [...document.querySelectorAll('.calendar-top>button')]}
function previousMonth(){const buttons=monthButtons();buttons[0]?.click()}
function nextMonth(){const buttons=monthButtons();buttons[buttons.length-1]?.click()}
function cancelLong(){if(longTimer){clearTimeout(longTimer);longTimer=null}}

function installStyles(){
 if(document.getElementById('betaCalendarGesturesStyles'))return;
 const style=document.createElement('style');style.id='betaCalendarGesturesStyles';
 style.textContent=`
  #monthGrid,.month-grid{touch-action:pan-y}
  #monthGrid .day,.month-grid .day{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
  .day.beta-longpress{transform:scale(.96);transition:transform .10s ease;box-shadow:0 5px 18px rgba(111,88,201,.16)!important}
  @media(prefers-reduced-motion:reduce){.day.beta-longpress{transition:none!important}}
 `;
 document.head.appendChild(style);
}

function openEventForDay(day){
 const date=String(day?.dataset?.day||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
 day.classList.remove('beta-longpress');
 const quick=window.HOMEBASE_BETA_QUICK_ADD;
 if(quick&&typeof quick.openNativeEditor==='function'){
   quick.openNativeEditor('event',date);
   return;
 }
 document.querySelector('.event-fab')?.click();
 setTimeout(()=>{
   const start=document.getElementById('startDate');
   const end=document.getElementById('endDate');
   if(start)start.value=date;
   if(end)end.value=date;
 },80);
}

function onPointerDown(event){
 if(event.pointerType==='mouse'&&event.button!==0)return;
 const g=grid();if(!g||!g.contains(event.target))return;
 const day=dayFrom(event.target);
 active={id:event.pointerId,x:event.clientX,y:event.clientY,at:Date.now(),day,longFired:false};
 cancelLong();
 if(day){
   longTimer=setTimeout(()=>{
     if(!active||active.id!==event.pointerId)return;
     active.longFired=true;
     suppressClickUntil=Date.now()+900;
     day.classList.add('beta-longpress');
     try{navigator.vibrate?.(12)}catch{}
   },LONG_PRESS_MS);
 }
}

function onPointerMove(event){
 if(!active||active.id!==event.pointerId)return;
 if(Math.hypot(event.clientX-active.x,event.clientY-active.y)>MOVE_TOLERANCE){
   cancelLong();
   if(!active.longFired)active.day?.classList.remove('beta-longpress');
 }
}

function finishPointer(event,cancelled=false){
 if(!active||active.id!==event.pointerId)return;
 cancelLong();
 const a=active;active=null;
 if(cancelled){a.day?.classList.remove('beta-longpress');return}
 if(a.longFired){
   event.preventDefault?.();
   event.stopPropagation?.();
   suppressClickUntil=Date.now()+900;
   // iOS can synthesize a delayed click at the release coordinates. Block all
   // clicks briefly, then open the editor after that release gesture has settled.
   suppressAllClickUntil=Date.now()+650;
   setTimeout(()=>openEventForDay(a.day),OPEN_DELAY_MS);
   return;
 }
 const dx=event.clientX-a.x,dy=event.clientY-a.y,elapsed=Date.now()-a.at;
 if(elapsed<850&&Math.abs(dx)>=SWIPE_PX&&Math.abs(dx)>Math.abs(dy)*1.35){
   suppressClickUntil=Date.now()+450;
   dx<0?nextMonth():previousMonth();
   try{navigator.vibrate?.(5)}catch{}
 }
}

function onClickCapture(event){
 if(Date.now()<suppressAllClickUntil){
   event.preventDefault();
   event.stopImmediatePropagation();
   return;
 }
 const day=dayFrom(event.target);if(!day)return;
 if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation()}
}
function onContextMenu(event){if(dayFrom(event.target)){event.preventDefault();event.stopPropagation()}}

function install(){
 installStyles();
 document.addEventListener('pointerdown',onPointerDown,true);
 document.addEventListener('pointermove',onPointerMove,true);
 document.addEventListener('pointerup',event=>finishPointer(event,false),true);
 document.addEventListener('pointercancel',event=>finishPointer(event,true),true);
 document.addEventListener('click',onClickCapture,true);
 document.addEventListener('contextmenu',onContextMenu,true);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_GESTURES={version:VERSION};
})();
