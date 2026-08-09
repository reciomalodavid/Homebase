(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
function label(){
  const build=Number(window.HOMEBASE_BETA_LOADED_BUILD||0);
  const patch=build>=2300?build-2300:null;
  return patch!==null?`Homebase Beta 2.3.${String(patch).padStart(2,'0')} · build ${build}`:`Homebase Beta · build ${build||'?'}`;
}
function place(){
  let badge=document.getElementById('betaVersionBadgeInline');
  if(!badge){badge=document.createElement('span');badge.id='betaVersionBadgeInline';}
  badge.textContent=label();
  badge.style.cssText='display:inline-flex;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(111,88,201,.10);border:1px solid rgba(111,88,201,.20);color:#5f4bb4;font-size:11px;font-weight:850;white-space:nowrap';
  const sync=document.getElementById('syncSection');
  if(sync){
    let slot=sync.querySelector('.beta-version-loaded-slot');
    if(!slot){slot=document.createElement('div');slot.className='beta-version-loaded-slot';slot.style.cssText='padding:0 16px 10px;display:flex;justify-content:flex-end';const details=sync.querySelector('.sync-details');if(details)details.prepend(slot);else sync.appendChild(slot)}
    if(badge.parentElement!==slot)slot.appendChild(badge);
    return;
  }
  const page=document.getElementById('morePage');if(!page)return;
  const hero=page.querySelector('.hero-row');
  if(hero){const right=hero.querySelector('.beta-version-slot')||(()=>{const box=document.createElement('div');box.className='beta-version-slot';box.style.cssText='display:flex;align-items:center;justify-content:flex-end;margin-left:10px';hero.appendChild(box);return box})();if(badge.parentElement!==right)right.appendChild(badge);return}
  if(badge.parentElement!==page)page.prepend(badge);
}
function install(){place();document.addEventListener('click',e=>{if(e.target.closest('.bottom-nav,#syncSummary'))setTimeout(place,40)},true);new MutationObserver(place).observe(document.documentElement,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_VERSION_LOCATION={version:VERSION,place,label};
})();