(()=>{
'use strict';
const VERSION='1';
function apply(){
  try{
    const join=document.getElementById('betaJoinDevice');
    const authorize=document.getElementById('betaAuthorizeDevice');
    const linked=!!(window.state&&state.syncCode);
    if(join&&linked) join.hidden=false;
    if(authorize&&linked) authorize.hidden=false;
  }catch{}
}
function install(){
  apply();
  const root=document.getElementById('syncSection')||document.body;
  if(root)new MutationObserver(apply).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
  setInterval(apply,1500);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SECURITY_PAIRING_UI={version:VERSION,refresh:apply};
})();
