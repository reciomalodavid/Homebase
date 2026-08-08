(()=>{
'use strict';

const VERSION='1.10.29';
let synthetic=false;
let down=null;

function installStyles(){
  if(document.getElementById('homebaseMobileNavStyles'))return;
  const style=document.createElement('style');
  style.id='homebaseMobileNavStyles';
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
  event.preventDefault();
  event.stopImmediatePropagation();
  synthetic=true;
  try{button.click()}finally{setTimeout(()=>{synthetic=false},0)}
}

function hideDuplicatePendingBlock(){
  const section=document.getElementById('morePendingTasks')?.closest('.section');
  if(section){section.hidden=true;section.style.display='none'}
}

function renameMoreToManagement(){
  const button=document.querySelector('.bottom-nav [data-page="morePage"]');
  if(button){
    const icon=button.querySelector('span')?.outerHTML||'<span>☰</span>';
    button.innerHTML=icon+'Gestión';
  }
  const title=document.querySelector('#morePage .hero-row h1,#morePage h1');
  if(title)title.textContent='Gestión';
}

function hidePendingNewButton(){
  const button=document.getElementById('newTask');
  if(button){button.hidden=true;button.style.setProperty('display','none','important');button.setAttribute('aria-hidden','true')}
}

function keepQuickAddVisible(){
  const fab=document.getElementById('eventFab')||document.querySelector('.event-fab');
  if(!fab)return;
  fab.hidden=false;
  fab.removeAttribute('aria-hidden');
  fab.style.setProperty('display','grid','important');
  fab.style.setProperty('visibility','visible','important');
  fab.style.setProperty('opacity','1','important');
  fab.style.setProperty('pointer-events','auto','important');
}

function applyUx(){
  hideDuplicatePendingBlock();
  renameMoreToManagement();
  hidePendingNewButton();
  keepQuickAddVisible();
}

function applyAfterNavigation(){
  requestAnimationFrame(()=>requestAnimationFrame(applyUx));
  setTimeout(applyUx,120);
}

function install(){
  installStyles();
  applyUx();
  document.addEventListener('pointerdown',onPointerDown,true);
  document.addEventListener('pointerup',onPointerUp,true);
  document.addEventListener('pointercancel',()=>{down=null},true);
  document.addEventListener('click',event=>{if(event.target.closest('.bottom-nav'))applyAfterNavigation()},true);
  window.addEventListener('pageshow',applyAfterNavigation);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAfterNavigation()});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_MOBILE_NAV={version:VERSION,apply:applyUx};
})();
