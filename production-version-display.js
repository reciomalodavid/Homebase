(()=>{
'use strict';
async function apply(){
 try{
  const response=await fetch(`./homebase-version.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;
  const data=await response.json();const el=document.getElementById('productionAppVersion');if(el)el.textContent=`Homebase ${data.version||'?'} · build ${data.build||'?'}`;
 }catch{}
}
function start(){apply();setTimeout(apply,500)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_VERSION_DISPLAY={apply};
})();