(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';
let synthetic=false;
let down=null;

function installStyles(){
  if(document.getElementById('betaBottomNavFixStyles'))return;
  const style=document.createElement('style');
  style.id='betaBottomNavFixStyles';
  style.textContent=`
    @media(max-width:767px){
      .bottom-nav{
        left:8px!important;
        right:8px!important;
        bottom:0!important;
        width:calc(100vw - 16px)!important;
        max-width:calc(100vw - 16px)!important;
        min-height:calc(68px + env(safe-area-inset-bottom))!important;
        padding:6px 5px max(6px,env(safe-area-inset-bottom))!important;
        border-radius:25px 25px 0 0!important;
        overflow:visible!important;
        touch-action:manipulation!important;
      }
      .bottom-nav .nav-btn,
      .bottom-nav button,
      .bottom-nav a,
      .bottom-nav .nav-item{
        min-height:58px!important;
        padding:6px 2px!important;
        border-radius:18px!important;
        touch-action:manipulation!important;
        -webkit-tap-highlight-color:transparent!important;
        user-select:none!important;
        -webkit-user-select:none!important;
      }
      .bottom-nav .nav-btn:active,
      .bottom-nav button:active,
      .bottom-nav a:active,
      .bottom-nav .nav-item:active{
        transform:scale(.97)!important;
        opacity:.82!important;
      }
      body{padding-bottom:calc(86px + env(safe-area-inset-bottom))!important}
      .event-fab,.fab,button.fab,[aria-label="Nuevo"].floating,.floating-add{
        bottom:calc(84px + env(safe-area-inset-bottom))!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function navButton(target){
  return target?.closest?.('.bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item')||null;
}

function onPointerDown(event){
  if(synthetic)return;
  const button=navButton(event.target);
  if(!button)return;
  down={button,id:event.pointerId,x:event.clientX,y:event.clientY,t:performance.now()};
}

function onPointerUp(event){
  if(synthetic||!down||down.id!==event.pointerId)return;
  const record=down;down=null;
  const button=navButton(event.target);
  if(!button||button!==record.button)return;
  const moved=Math.hypot(event.clientX-record.x,event.clientY-record.y);
  const elapsed=performance.now()-record.t;
  if(moved>18||elapsed>900)return;

  // iOS/Safari can occasionally lose the synthesized click after the shared
  // pointerdown page-reset handler. Prevent that click and issue one clean click.
  event.preventDefault();
  event.stopImmediatePropagation();
  synthetic=true;
  try{button.click()}finally{setTimeout(()=>{synthetic=false},0)}
}

function onPointerCancel(){down=null}

function install(){
  installStyles();
  document.addEventListener('pointerdown',onPointerDown,true);
  document.addEventListener('pointerup',onPointerUp,true);
  document.addEventListener('pointercancel',onPointerCancel,true);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_BOTTOM_NAV_FIX={version:VERSION};
})();
