(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
function clearGhostBackdrop(){
  const backdrop=document.getElementById('betaQuickAddBackdrop');
  const menu=document.getElementById('betaQuickAddMenu');
  const fab=document.querySelector('.event-fab.beta-quick-main');
  const menuOpen=!!menu?.classList.contains('open');
  const fabOpen=!!fab?.classList.contains('beta-quick-open');
  if(backdrop?.classList.contains('open')&&(!menuOpen||!fabOpen))backdrop.classList.remove('open');
  if(menuOpen!==fabOpen){menu?.classList.remove('open');fab?.classList.remove('beta-quick-open');fab?.setAttribute('aria-expanded','false');backdrop?.classList.remove('open')}
}
function forceLight(){
  document.documentElement.style.setProperty('color-scheme','light','important');
  document.body.style.setProperty('color-scheme','light','important');
  clearGhostBackdrop();
}
function install(){
  if(!document.getElementById('betaLightModeGuardStyles')){
    const s=document.createElement('style');s.id='betaLightModeGuardStyles';s.textContent=`
    :root,html,body{color-scheme:light!important}
    html,body{background-color:#eef6fd!important;color:#1d1d1f!important}
    #betaQuickAddBackdrop:not(.open){opacity:0!important;pointer-events:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    `;document.head.appendChild(s);
  }
  forceLight();
  window.addEventListener('pageshow',()=>setTimeout(forceLight,0));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(forceLight,0)});
  document.addEventListener('click',()=>setTimeout(clearGhostBackdrop,80),true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_LIGHT_MODE_GUARD={version:VERSION,apply:forceLight};
})();