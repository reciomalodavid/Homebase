(()=>{
'use strict';
function loadNotesBadges(){
 if(document.querySelector('script[data-homebase-notes-badges]'))return;
 const s=document.createElement('script');s.src=`./homebase-notes-badges.js?v=${Date.now()}`;s.dataset.homebaseNotesBadges='1';document.head.appendChild(s)
}
async function apply(){
 try{
  const response=await fetch(`./homebase-version.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;
  const data=await response.json();const el=document.getElementById('productionAppVersion');if(el)el.textContent=`Homebase ${data.version||'?'} · build ${data.build||'?'}`;
 }catch{}
 loadNotesBadges();
}
function start(){loadNotesBadges();apply();setTimeout(apply,500)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_VERSION_DISPLAY={apply,loadNotesBadges};
})();