(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
function place(){
  const topbar=document.querySelector('.topbar');
  const button=document.getElementById('betaGlobalSearchButton');
  if(!topbar||!button)return false;
  if(button.parentElement!==topbar)topbar.appendChild(button);
  topbar.style.position='relative';
  button.style.setProperty('position','absolute','important');
  button.style.setProperty('right',window.innerWidth>=768?'132px':'116px','important');
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
  let tries=0;
  const tick=()=>{tries++;if(place()||tries>40)return;setTimeout(tick,100)};
  tick();
  const observer=new MutationObserver(()=>place());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest('.bottom-nav,.topbar'))setTimeout(place,0)},true);
  window.addEventListener('resize',place);
  window.addEventListener('orientationchange',()=>setTimeout(place,80));
  window.addEventListener('pageshow',place);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)place()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SEARCH_PLACEMENT={version:VERSION,place};
})();
