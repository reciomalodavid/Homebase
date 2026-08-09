(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
function place(){
  let badge=document.getElementById('betaVersionBadgeInline');
  if(!badge){badge=document.createElement('span');badge.id='betaVersionBadgeInline';badge.textContent='BETA 2.3';}
  const page=document.getElementById('morePage');if(!page)return;
  const hero=page.querySelector('.hero-row');
  if(hero){
    const right=hero.querySelector('.beta-version-slot')||(()=>{const box=document.createElement('div');box.className='beta-version-slot';box.style.cssText='display:flex;align-items:center;justify-content:flex-end;margin-left:10px';hero.appendChild(box);return box})();
    if(badge.parentElement!==right)right.appendChild(badge);
    return;
  }
  if(badge.parentElement!==page)page.prepend(badge);
}
function install(){place();document.addEventListener('click',e=>{if(e.target.closest('.bottom-nav'))setTimeout(place,40)},true);new MutationObserver(place).observe(document.documentElement,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_VERSION_LOCATION={version:VERSION,place};
})();