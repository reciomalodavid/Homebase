(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='3';
function removeDuplicates(){
 document.querySelectorAll('#betaLoadedBuildStatic,#betaVersionBadge,.beta-version-slot').forEach(node=>node.remove());
 const badges=[...document.querySelectorAll('#betaVersionBadgeInline')];badges.slice(1).forEach(node=>node.remove());
}
function restoreSearch(){
 try{window.HOMEBASE_BETA_NAVIGATION_UX?.apply?.()}catch(error){console.warn('Beta search restore',error)}
 const actions=document.querySelector('.top-actions'),button=document.getElementById('betaGlobalSearchButton');
 if(!actions||!button)return false;
 if(button.parentElement!==actions)actions.insertBefore(button,actions.firstChild);
 for(const property of ['position','left','right','top','transform','z-index'])button.style.removeProperty(property);
 button.style.setProperty('display','grid','important');
 button.style.setProperty('visibility','visible','important');
 button.style.setProperty('opacity','1','important');
 button.style.setProperty('pointer-events','auto','important');
 return true;
}
function place(){
 removeDuplicates();
 const brand=document.querySelector('.topbar .brand');if(!brand)return false;
 const copy=brand.querySelector(':scope > div')||brand;
 let badge=document.getElementById('betaVersionBadgeInline');
 if(!badge){badge=document.createElement('div');badge.id='betaVersionBadgeInline';copy.appendChild(badge)}
 const label=`v${window.HOMEBASE_BETA_VERSION||'2.3.101'} · b${window.HOMEBASE_BETA_LOADED_BUILD||2401}`;
 if(badge.textContent!==label)badge.textContent=label;
 restoreSearch();
 return true;
}
function install(){
 place();
 setTimeout(place,80);
 setTimeout(place,400);
 window.addEventListener('pageshow',place);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)place()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_VERSION_LOCATION={version:VERSION,place,restoreSearch};
})();