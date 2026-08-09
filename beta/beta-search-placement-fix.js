(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='3';
function visibleControl(el){const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none'}
function place(){
  const topbar=document.querySelector('.topbar');
  const button=document.getElementById('betaGlobalSearchButton');
  if(!topbar||!button)return false;
  if(button.parentElement!==topbar)topbar.appendChild(button);
  topbar.style.position='relative';
  const bar=topbar.getBoundingClientRect();
  const brand=topbar.querySelector('.brand');
  const brandRight=brand?.getBoundingClientRect().right||bar.left;
  const candidates=[...topbar.querySelectorAll('button,.icon-btn')].filter(el=>el!==button&&visibleControl(el));
  const firstRight=candidates.map(el=>el.getBoundingClientRect()).filter(r=>r.left>brandRight+18).sort((a,b)=>a.left-b.left)[0];
  const width=button.getBoundingClientRect().width||42;
  let left;
  if(firstRight)left=Math.max(brandRight-bar.left+18,firstRight.left-bar.left-width-12);
  else left=Math.max(brandRight-bar.left+18,bar.width-width-116);
  button.style.setProperty('position','absolute','important');
  button.style.setProperty('left',`${Math.round(left)}px`,'important');
  button.style.removeProperty('right');
  button.style.setProperty('top','50%','important');
  button.style.setProperty('transform','translateY(-50%)','important');
  button.style.setProperty('z-index','30','important');
  button.style.setProperty('display','grid','important');
  button.style.setProperty('visibility','visible','important');
  button.style.setProperty('opacity','1','important');
  button.style.setProperty('pointer-events','auto','important');
  return true;
}
function install(){
  let tries=0;const tick=()=>{tries++;if(place()||tries>40)return;setTimeout(tick,100)};tick();
  const observer=new MutationObserver(()=>requestAnimationFrame(place));observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest('.bottom-nav,.topbar'))setTimeout(place,0)},true);
  window.addEventListener('resize',()=>requestAnimationFrame(place));
  window.addEventListener('orientationchange',()=>setTimeout(place,120));
  window.addEventListener('pageshow',place);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)place()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SEARCH_PLACEMENT={version:VERSION,place};
})();