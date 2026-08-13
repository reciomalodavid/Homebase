(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
function place(){
 const brand=document.querySelector('.topbar .brand');if(!brand)return false;
 const copy=brand.querySelector(':scope > div')||brand;
 let badge=document.getElementById('betaVersionBadgeInline');
 if(!badge){badge=document.createElement('div');badge.id='betaVersionBadgeInline'}
 badge.textContent=`Beta ${window.HOMEBASE_BETA_VERSION||'2.3.100'} · b${window.HOMEBASE_BETA_LOADED_BUILD||2400}`;
 if(badge.parentElement!==copy)copy.appendChild(badge);
 return true;
}
function install(){place();new MutationObserver(()=>requestAnimationFrame(place)).observe(document.querySelector('.topbar')||document.documentElement,{childList:true,subtree:true});window.addEventListener('pageshow',place)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_VERSION_LOCATION={version:VERSION,place};
})();