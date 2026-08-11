(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';
const LONG_PRESS_MS=560;
const SWIPE_PX=58;
const MOVE_TOLERANCE=12;
const DOUBLE_TAP_MS=360;

let active=null;
let longTimer=null;
let suppressClickUntil=0;
let lastTap={day:'',at:0};

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
  .day.beta-longpress{transform:scale(.96);transition:transform .10s ease;box-shadow:0 5px 18px rgba(111,88,201,.16)!important}
  #selectedDayPanel.beta-day-focus{animation:betaDayFocus .55s ease}
  @keyframes betaDayFocus{0%{transform:translateY(6px);opacity:.72}100%{transform:none;opacity:1}}
  @media(prefers-reduced-motion:reduce){.day.beta-longpress,#selectedDayPanel.beta-day-focus{transition:none!important;animation:none!important}}
 `;
 document.head.appendChild(style);
}

function openEventForDay(day){
 if(!day)return;
 suppressClickUntil=Date.now()+700;
 day.classList.add('beta-longpress');
 try{navigator.vibrate?.(12)}catch{}
 // Select the date first so the native editor inherits it.
 day.click();
 setTimeout(()=>{
   day.classList.remove('beta-longpress');
   const quick=window.HOMEBASE_BETA_QUICK_ADD;
   if(quick&&typeof quick.openNativeEditor==='function')quick.openNativeEditor('event');
   else document.querySelector('.event-fab')?.click();
 },70);
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
     openEventForDay(day);
   },LONG_PRESS_MS);
 }
}

function onPointerMove(event){
 if(!active||active.id!==event.pointerId)return;
 if(Math.hypot(event.clientX-active.x,event.clientY-active.y)>MOVE_TOLERANCE)cancelLong();
}

function finishPointer(event,cancelled=false){
 if(!active||active.id!==event.pointerId)return;
 cancelLong();
 const a=active;active=null;
 if(cancelled||a.longFired)return;
 const dx=event.clientX-a.x,dy=event.clientY-a.y,elapsed=Date.now()-a.at;
 if(elapsed<850&&Math.abs(dx)>=SWIPE_PX&&Math.abs(dx)>Math.abs(dy)*1.35){
   suppressClickUntil=Date.now()+450;
   dx<0?nextMonth():previousMonth();
   try{navigator.vibrate?.(5)}catch{}
 }
}

function onClickCapture(event){
 const day=dayFrom(event.target);if(!day)return;
 if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();return}
}

function onClickBubble(event){
 const day=dayFrom(event.target);if(!day)return;
 const key=String(day.dataset.day||'');const now=Date.now();
 if(lastTap.day===key&&now-lastTap.at<=DOUBLE_TAP_MS){
   lastTap={day:'',at:0};
   setTimeout(()=>{
     const panel=document.getElementById('selectedDayPanel');if(!panel||!panel.textContent.trim())return;
     panel.classList.remove('beta-day-focus');void panel.offsetWidth;panel.classList.add('beta-day-focus');
     panel.scrollIntoView({behavior:'smooth',block:'nearest'});
     setTimeout(()=>panel.classList.remove('beta-day-focus'),700);
   },60);
 }else lastTap={day:key,at:now};
}

function install(){
 installStyles();
 document.addEventListener('pointerdown',onPointerDown,true);
 document.addEventListener('pointermove',onPointerMove,true);
 document.addEventListener('pointerup',event=>finishPointer(event,false),true);
 document.addEventListener('pointercancel',event=>finishPointer(event,true),true);
 document.addEventListener('click',onClickCapture,true);
 document.addEventListener('click',onClickBubble,false);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_GESTURES={version:VERSION};
})();
