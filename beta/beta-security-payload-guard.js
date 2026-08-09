(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
function patch(){
  if(typeof cloudPayload!=='function')return false;
  if(cloudPayload.__betaSecurityGuard)return true;
  const original=cloudPayload;
  const wrapped=function(){
    const payload=original();
    if(payload&&typeof payload==='object'){
      delete payload.authorizedUids;
      delete payload.securityJoinToken;
      delete payload.securityUpdatedAt;
    }
    return payload;
  };
  wrapped.__betaSecurityGuard=true;
  cloudPayload=wrapped;
  return true;
}
function install(){
  patch();
  [0,50,150,400,900,1800,3500].forEach(ms=>setTimeout(patch,ms));
  window.addEventListener('pageshow',patch);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)patch()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SECURITY_PAYLOAD_GUARD={version:VERSION,patch};
})();
