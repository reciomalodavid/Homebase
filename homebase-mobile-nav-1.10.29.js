(()=>{
'use strict';

const VERSION='1.10.46';
let synthetic=false;
let down=null;

function installStyles(){
  if(document.getElementById('homebaseMobileNavStyles'))return;
  const style=document.createElement('style');
  style.id='homebaseMobileNavStyles';
  style.textContent=`
    @media(max-width:767px){
      #newBtn,.hero-row .new-btn{display:none!important}

      .bottom-nav{
        left:12px!important;
        right:12px!important;
        bottom:calc(8px + env(safe-area-inset-bottom))!important;
        width:calc(100vw - 24px)!important;
        max-width:calc(100vw - 24px)!important;
        min-height:70px!important;
        height:70px!important;
        padding:7px 7px!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr) 62px minmax(0,1fr) minmax(0,1fr)!important;
        align-items:stretch!important;
        column-gap:1px!important;
        border-radius:30px!important;
        overflow:visible!important;
        touch-action:manipulation!important;
        background:rgba(255,252,248,.94)!important;
        border:1px solid rgba(255,255,255,.98)!important;
        box-shadow:0 12px 32px rgba(67,48,31,.13),inset 0 1px 0 rgba(255,255,255,.98)!important;
        -webkit-backdrop-filter:blur(28px) saturate(170%)!important;
        backdrop-filter:blur(28px) saturate(170%)!important;
      }

      /* Recorte central realista: el círculo del fondo muerde la barra y crea la hendidura. */
      .bottom-nav::before{
        content:""!important;
        position:absolute!important;
        left:50%!important;
        top:-27px!important;
        width:76px!important;
        height:76px!important;
        transform:translateX(-50%)!important;
        border-radius:50%!important;
        background:#f7f3ee!important;
        box-shadow:0 1px 0 rgba(255,255,255,.88),inset 0 -1px 0 rgba(206,188,171,.18)!important;
        pointer-events:none!important;
        z-index:1!important;
      }
      .bottom-nav::after{
        content:""!important;
        position:absolute!important;
        left:50%!important;
        top:-25px!important;
        width:72px!important;
        height:72px!important;
        transform:translateX(-50%)!important;
        border-radius:50%!important;
        border:1px solid rgba(255,255,255,.96)!important;
        box-shadow:0 7px 18px rgba(82,57,37,.08)!important;
        pointer-events:none!important;
        z-index:2!important;
      }

      .bottom-nav> :nth-child(1){grid-column:1!important}
      .bottom-nav> :nth-child(2){grid-column:2!important}
      .bottom-nav> :nth-child(3){grid-column:4!important}
      .bottom-nav> :nth-child(4){grid-column:5!important}

      .bottom-nav .nav-btn,
      .bottom-nav button,
      .bottom-nav a,
      .bottom-nav .nav-item{
        position:relative!important;
        z-index:3!important;
        min-width:0!important;
        width:100%!important;
        min-height:56px!important;
        height:56px!important;
        padding:5px 1px!important;
        border-radius:22px!important;
        color:#172033!important;
        background:transparent!important;
        box-shadow:none!important;
        touch-action:manipulation!important;
        -webkit-tap-highlight-color:transparent!important;
        user-select:none!important;
        -webkit-user-select:none!important;
      }
      .bottom-nav .nav-btn *,
      .bottom-nav button *,
      .bottom-nav a *,
      .bottom-nav .nav-item *{color:inherit!important}

      .bottom-nav .active,
      .bottom-nav [aria-current="page"]{
        background:linear-gradient(145deg,#fb8918,#ea7208)!important;
        color:#fff!important;
        box-shadow:0 7px 17px rgba(227,103,8,.24),inset 0 1px 0 rgba(255,255,255,.28)!important;
        text-shadow:0 1px 1px rgba(110,45,0,.12)!important;
      }
      .bottom-nav .active *,
      .bottom-nav [aria-current="page"] *{color:#fff!important}

      .bottom-nav .nav-btn:active,
      .bottom-nav button:active,
      .bottom-nav a:active,
      .bottom-nav .nav-item:active{transform:scale(.97)!important;opacity:.88!important}

      #eventFab,.event-fab,.fab,button.fab,[aria-label="Nuevo"].floating,.floating-add{
        position:fixed!important;
        left:50%!important;
        right:auto!important;
        bottom:calc(49px + env(safe-area-inset-bottom))!important;
        width:58px!important;
        height:58px!important;
        min-width:58px!important;
        min-height:58px!important;
        margin:0!important;
        padding:0!important;
        transform:translateX(-50%)!important;
        border-radius:50%!important;
        border:1.5px solid rgba(255,255,255,.88)!important;
        background:linear-gradient(145deg,#ff8b1b,#ed7308)!important;
        color:#fff!important;
        box-shadow:0 9px 20px rgba(224,101,7,.28),inset 0 1px 0 rgba(255,255,255,.30)!important;
        z-index:940!important;
        display:grid!important;
        place-items:center!important;
        font-size:36px!important;
        line-height:1!important;
      }
      #eventFab *,.event-fab *,.fab *,button.fab *,[aria-label="Nuevo"].floating *,.floating-add *{color:#fff!important}

      body{padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}
    }

    @media(max-width:390px){
      .bottom-nav{
        left:8px!important;
        right:8px!important;
        width:calc(100vw - 16px)!important;
        max-width:calc(100vw - 16px)!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr) 58px minmax(0,1fr) minmax(0,1fr)!important;
        padding:7px 5px!important;
        border-radius:28px!important;
      }
      .bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item{font-size:10.5px!important;padding-left:0!important;padding-right:0!important}
      .bottom-nav::before{width:72px!important;height:72px!important;top:-25px!important}
      .bottom-nav::after{width:68px!important;height:68px!important;top:-23px!important}
      #eventFab,.event-fab,.fab,button.fab,[aria-label="Nuevo"].floating,.floating-add{
        width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;
        bottom:calc(48px + env(safe-area-inset-bottom))!important;
        font-size:34px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function navButton(target){return target?.closest?.('.bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item')||null}
function onPointerDown(event){if(synthetic)return;const button=navButton(event.target);if(!button)return;down={button,id:event.pointerId,x:event.clientX,y:event.clientY,t:performance.now()}}
function onPointerUp(event){if(synthetic||!down||down.id!==event.pointerId)return;const record=down;down=null;const button=navButton(event.target);if(!button||button!==record.button)return;const moved=Math.hypot(event.clientX-record.x,event.clientY-record.y);const elapsed=performance.now()-record.t;if(moved>18||elapsed>900)return;event.preventDefault();event.stopImmediatePropagation();synthetic=true;try{button.click()}finally{setTimeout(()=>{synthetic=false},0)}}
function hideDuplicatePendingBlock(){const section=document.getElementById('morePendingTasks')?.closest('.section');if(section){section.hidden=true;section.style.display='none'}}
function renameMoreToManagement(){const button=document.querySelector('.bottom-nav [data-page="morePage"]');if(button){const icon=button.querySelector('span')?.outerHTML||'<span>☰</span>';button.innerHTML=icon+'Gestión'}const title=document.querySelector('#morePage .hero-row h1,#morePage h1');if(title)title.textContent='Gestión'}
function hidePendingNewButton(){const button=document.getElementById('newTask');if(button){button.hidden=true;button.style.setProperty('display','none','important');button.setAttribute('aria-hidden','true')}}
function keepQuickAddVisible(){const fab=document.getElementById('eventFab')||document.querySelector('.event-fab');if(!fab)return;fab.hidden=false;fab.removeAttribute('aria-hidden');fab.style.setProperty('display','grid','important');fab.style.setProperty('visibility','visible','important');fab.style.setProperty('opacity','1','important');fab.style.setProperty('pointer-events','auto','important')}
function applyUx(){hideDuplicatePendingBlock();renameMoreToManagement();hidePendingNewButton();keepQuickAddVisible()}
function applyAfterNavigation(){requestAnimationFrame(()=>requestAnimationFrame(applyUx));setTimeout(applyUx,120)}
function install(){installStyles();applyUx();document.addEventListener('pointerdown',onPointerDown,true);document.addEventListener('pointerup',onPointerUp,true);document.addEventListener('pointercancel',()=>{down=null},true);document.addEventListener('click',event=>{if(event.target.closest('.bottom-nav'))applyAfterNavigation()},true);window.addEventListener('pageshow',applyAfterNavigation);document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAfterNavigation()})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_MOBILE_NAV={version:VERSION,apply:applyUx};
})();
