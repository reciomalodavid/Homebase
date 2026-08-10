(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
function forceLight(){
  document.documentElement.style.setProperty('color-scheme','light','important');
  document.body.style.setProperty('color-scheme','light','important');
  let meta=document.querySelector('meta[name="color-scheme"]');
  if(!meta){meta=document.createElement('meta');meta.name='color-scheme';document.head.appendChild(meta)}
  meta.content='light';
  document.getElementById('betaQuickAddBackdrop')?.classList.remove('open');
}
function install(){
  if(!document.getElementById('betaLightModeGuardStyles')){
    const s=document.createElement('style');s.id='betaLightModeGuardStyles';s.textContent=`
    :root,html,body{color-scheme:light!important}
    html,body{background-color:#eef6fd!important;color:#1d1d1f!important}
    body::before{background:rgba(238,246,253,.88)!important}
    #betaQuickAddBackdrop{display:none!important;opacity:0!important;pointer-events:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    @media(prefers-color-scheme:dark){
      :root,html,body{color-scheme:light!important}
      html,body{background:radial-gradient(circle at 7% 2%,rgba(255,255,255,.94),transparent 30%),radial-gradient(circle at 96% 8%,rgba(170,218,255,.30),transparent 34%),linear-gradient(180deg,#f5faff 0%,#eef6fd 48%,#e7f2fc 100%)!important;color:#1d1d1f!important}
      .topbar,.bottom-nav,.card,.calendar-shell,.today-focus,.today-stats,.list-card,.roster-card,.section,.sync-section>.card{filter:none!important;opacity:1!important;color:#1d1d1f!important}
      .topbar,.card,.calendar-shell,.today-focus,.today-stats{background:rgba(255,255,255,.64)!important;border-color:rgba(255,255,255,.88)!important}
      .bottom-nav{background:rgba(247,251,255,.78)!important;border-color:rgba(255,255,255,.88)!important}
      .hero-row h1,.section-head h2,.event-title,.task-title,.roster-title,.sync-summary-title,.today-focus-title,.today-stat strong,.calendar-title,.week-name,.week-num,.profile-row strong{color:#1d1d1f!important;-webkit-text-fill-color:#1d1d1f!important}
      .brand-sub,.event-meta,.roster-sub,.sync-summary-sub,.hero-date,.section-head span,.today-focus-meta,.today-stat span,.weekdays div,.profile-kind{color:#74747b!important;-webkit-text-fill-color:#74747b!important}
      input,select,textarea{color-scheme:light!important;background:#fff!important;color:#1d1d1f!important;-webkit-text-fill-color:#1d1d1f!important}
    }
    `;document.head.appendChild(s);
  }
  forceLight();
  window.addEventListener('pageshow',()=>setTimeout(forceLight,0));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(forceLight,0)});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_LIGHT_MODE_GUARD={version:VERSION,apply:forceLight};
})();