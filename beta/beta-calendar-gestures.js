(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='7';
const SWIPE_PX=58;
const MOVE_TOLERANCE=12;

let active=null;
let suppressClickUntil=0;

function grid(){return document.getElementById('monthGrid')||document.querySelector('.month-grid')}
function monthButtons(){return [...document.querySelectorAll('.calendar-top>button')]}
function previousMonth(){const buttons=monthButtons();buttons[0]?.click()}
function nextMonth(){const buttons=monthButtons();buttons[buttons.length-1]?.click()}

function installStyles(){
 if(document.getElementById('betaCalendarGesturesStyles'))return;
 const style=document.createElement('style');style.id='betaCalendarGesturesStyles';
 style.textContent=`
  #monthGrid,.month-grid{touch-action:pan-y}
 `;
 document.head.appendChild(style);
}

function onPointerDown(event){
 if(event.pointerType==='mouse'&&event.button!==0)return;
 const g=grid();if(!g||!g.contains(event.target))return;
 active={id:event.pointerId,x:event.clientX,y:event.clientY,at:Date.now(),moved:false};
}

function onPointerMove(event){
 if(!active||active.id!==event.pointerId)return;
 if(Math.hypot(event.clientX-active.x,event.clientY-active.y)>MOVE_TOLERANCE)active.moved=true;
}

function finishPointer(event,cancelled=false){
 if(!active||active.id!==event.pointerId)return;
 const a=active;active=null;
 if(cancelled)return;
 const dx=event.clientX-a.x,dy=event.clientY-a.y,elapsed=Date.now()-a.at;
 if(elapsed<850&&Math.abs(dx)>=SWIPE_PX&&Math.abs(dx)>Math.abs(dy)*1.35){
   suppressClickUntil=Date.now()+220;
   event.preventDefault?.();
   dx<0?nextMonth():previousMonth();
   try{navigator.vibrate?.(5)}catch{}
 }
}

function onClickCapture(event){
 if(Date.now()>=suppressClickUntil)return;
 const g=grid();if(!g||!g.contains(event.target))return;
 event.preventDefault();
 event.stopImmediatePropagation();
}

function install(){
 installStyles();
 document.addEventListener('pointerdown',onPointerDown,true);
 document.addEventListener('pointermove',onPointerMove,true);
 document.addEventListener('pointerup',event=>finishPointer(event,false),true);
 document.addEventListener('pointercancel',event=>finishPointer(event,true),true);
 document.addEventListener('click',onClickCapture,true);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_GESTURES={version:VERSION};
})();
