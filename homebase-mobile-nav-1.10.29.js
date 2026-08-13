(()=>{
'use strict';
const VERSION='1.10.50';
let synthetic=false,down=null;
function installStyles(){
 if(document.getElementById('homebaseMobileNavStyles'))return;
 const style=document.createElement('style');style.id='homebaseMobileNavStyles';style.textContent=`
 @media(max-width:767px){
 #newBtn,.hero-row .new-btn{display:none!important}
 .brand{gap:10px!important}
 .brand img{display:block!important;width:42px!important;height:42px!important;border-radius:11px!important;box-shadow:0 4px 14px rgba(75,53,33,.08)!important}
 #homebaseBrandMark{display:none!important}
 .brand-title{font-size:24px!important;font-weight:720!important;letter-spacing:-.5px!important;color:#182230!important}
 .brand-sub{display:none!important}
 .bottom-nav{left:12px!important;right:12px!important;bottom:0!important;width:calc(100vw - 24px)!important;max-width:calc(100vw - 24px)!important;height:calc(70px + env(safe-area-inset-bottom))!important;min-height:calc(70px + env(safe-area-inset-bottom))!important;padding:7px 7px max(7px,env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 62px minmax(0,1fr) minmax(0,1fr)!important;align-items:start!important;column-gap:1px!important;border-radius:30px 30px 0 0!important;overflow:visible!important;background:rgba(255,252,248,.97)!important;border:1px solid rgba(255,255,255,.98)!important;border-bottom:0!important;box-shadow:0 -8px 28px rgba(67,48,31,.09),inset 0 1px 0 rgba(255,255,255,.98)!important;-webkit-backdrop-filter:blur(28px) saturate(170%)!important;backdrop-filter:blur(28px) saturate(170%)!important}
 .bottom-nav::before,.bottom-nav::after{content:none!important;display:none!important}
 .bottom-nav>:nth-child(1){grid-column:1!important}.bottom-nav>:nth-child(2){grid-column:2!important}.bottom-nav>:nth-child(3){grid-column:4!important}.bottom-nav>:nth-child(4){grid-column:5!important}
 .bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item{position:relative!important;z-index:3!important;min-width:0!important;width:100%!important;height:56px!important;min-height:56px!important;padding:5px 1px!important;border-radius:22px!important;color:#172033!important;background:transparent!important;box-shadow:none!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;user-select:none!important;-webkit-user-select:none!important}
 .bottom-nav .nav-btn *,.bottom-nav button *,.bottom-nav a *,.bottom-nav .nav-item *{color:inherit!important}
 .bottom-nav .nav-btn.active,.bottom-nav .active,.bottom-nav [aria-current="page"]{background:linear-gradient(145deg,rgba(255,236,218,.96),rgba(255,244,233,.94))!important;color:#d66f16!important;box-shadow:0 5px 15px rgba(215,116,30,.13),0 0 0 1px rgba(234,139,61,.16) inset,0 0 18px rgba(242,156,79,.08)!important;text-shadow:none!important}
 .bottom-nav .nav-btn.active *,.bottom-nav .active *,.bottom-nav [aria-current="page"] *{color:#d66f16!important}
 .bottom-nav .nav-btn:active,.bottom-nav button:active,.bottom-nav a:active,.bottom-nav .nav-item:active{transform:scale(.97)!important;opacity:.9!important}
 #eventFab,.event-fab,.fab,button.fab,[aria-label="Nuevo"].floating,.floating-add{position:fixed!important;left:50%!important;right:auto!important;bottom:calc(56px + env(safe-area-inset-bottom))!important;width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;margin:0!important;padding:0!important;transform:translateX(-50%)!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.82)!important;background:linear-gradient(145deg,#f79a43,#e57a1b)!important;color:#fff!important;box-shadow:0 8px 18px rgba(203,103,19,.22),inset 0 1px 0 rgba(255,255,255,.28)!important;z-index:940!important;display:grid!important;place-items:center!important;font-size:34px!important;line-height:1!important}
 #eventFab *,.event-fab *,.fab *,button.fab *,[aria-label="Nuevo"].floating *,.floating-add *{color:#fff!important}
 body{padding-bottom:calc(90px + env(safe-area-inset-bottom))!important}
 }
 @media(max-width:390px){.bottom-nav{left:8px!important;right:8px!important;width:calc(100vw - 16px)!important;max-width:calc(100vw - 16px)!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 58px minmax(0,1fr) minmax(0,1fr)!important;padding:7px 5px max(7px,env(safe-area-inset-bottom))!important;border-radius:28px 28px 0 0!important}.bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item{font-size:10.5px!important;padding-left:0!important;padding-right:0!important}#eventFab,.event-fab,.fab,button.fab,[aria-label="Nuevo"].floating,.floating-add{width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;bottom:calc(55px + env(safe-area-inset-bottom))!important;font-size:33px!important}}
 `;document.head.appendChild(style)
}
function navButton(t){return t?.closest?.('.bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item')||null}
function refineBranding(){
 const brand=document.querySelector('.brand');if(!brand)return;
 const mark=document.getElementById('homebaseBrandMark');if(mark)mark.remove();
 const img=brand.querySelector('img');if(img){
  const desired=new URL('./homebase-icon-simple.svg',location.href).href;
  if(img.src!==desired)img.src=desired;
  img.style.setProperty('display','block','important');
  img.alt='Homebase';
 }
 const title=brand.querySelector('.brand-title');if(title){title.style.setProperty('font-weight','720','important');title.style.setProperty('letter-spacing','-.5px','important')}
}
function enforceActiveTab(){
 const tabs=[...document.querySelectorAll('.bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item')];
 for(const tab of tabs){
  const active=tab.classList.contains('active')||tab.getAttribute('aria-current')==='page';
  if(active){
   tab.style.setProperty('background','linear-gradient(145deg,rgba(255,236,218,.96),rgba(255,244,233,.94))','important');
   tab.style.setProperty('color','#d66f16','important');
   tab.style.setProperty('box-shadow','0 5px 15px rgba(215,116,30,.13),0 0 18px rgba(242,156,79,.08),inset 0 0 0 1px rgba(234,139,61,.16)','important');
  }else{
   tab.style.setProperty('background','transparent','important');
   tab.style.setProperty('color','#172033','important');
   tab.style.setProperty('box-shadow','none','important');
  }
 }
}
function onPointerDown(e){if(synthetic)return;const b=navButton(e.target);if(!b)return;down={button:b,id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()}}
function onPointerUp(e){if(synthetic||!down||down.id!==e.pointerId)return;const r=down;down=null;const b=navButton(e.target);if(!b||b!==r.button)return;if(Math.hypot(e.clientX-r.x,e.clientY-r.y)>18||performance.now()-r.t>900)return;e.preventDefault();e.stopImmediatePropagation();synthetic=true;try{b.click()}finally{setTimeout(()=>synthetic=false,0)}}
function hideDuplicatePendingBlock(){const s=document.getElementById('morePendingTasks')?.closest('.section');if(s){s.hidden=true;s.style.display='none'}}
function renameMoreToManagement(){const b=document.querySelector('.bottom-nav [data-page="morePage"]');if(b){const i=b.querySelector('span')?.outerHTML||'<span>☰</span>';b.innerHTML=i+'Gestión'}const t=document.querySelector('#morePage .hero-row h1,#morePage h1');if(t)t.textContent='Gestión'}
function hidePendingNewButton(){const b=document.getElementById('newTask');if(b){b.hidden=true;b.style.setProperty('display','none','important');b.setAttribute('aria-hidden','true')}}
function keepQuickAddVisible(){const f=document.getElementById('eventFab')||document.querySelector('.event-fab');if(!f)return;f.hidden=false;f.removeAttribute('aria-hidden');f.style.setProperty('display','grid','important');f.style.setProperty('visibility','visible','important');f.style.setProperty('opacity','1','important');f.style.setProperty('pointer-events','auto','important')}
function applyUx(){hideDuplicatePendingBlock();renameMoreToManagement();hidePendingNewButton();keepQuickAddVisible();refineBranding();enforceActiveTab()}
function after(){requestAnimationFrame(()=>requestAnimationFrame(applyUx));setTimeout(applyUx,80);setTimeout(applyUx,220)}
function install(){installStyles();applyUx();document.addEventListener('pointerdown',onPointerDown,true);document.addEventListener('pointerup',onPointerUp,true);document.addEventListener('pointercancel',()=>down=null,true);document.addEventListener('click',e=>{if(e.target.closest('.bottom-nav'))after()},true);window.addEventListener('pageshow',after);document.addEventListener('visibilitychange',()=>{if(!document.hidden)after()});new MutationObserver(enforceActiveTab).observe(document.querySelector('.bottom-nav')||document.body,{attributes:true,subtree:true,attributeFilter:['class','aria-current']})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_MOBILE_NAV={version:VERSION,apply:applyUx};
})();