(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2',BUILD=2398,APP_VERSION='2.3.98';
const STYLE_ID='brpPrintFit2398';
const CSS=`
@page{size:A4 landscape;margin:8mm!important}
@media print{
  html,body{margin:0!important;padding:0!important;width:auto!important;height:auto!important;overflow:hidden!important;background:#fff!important}
  body{min-height:0!important}
  .brp-sheet{width:100%!important;height:166mm!important;max-height:166mm!important;margin:0!important;padding:0!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr)!important;break-inside:avoid!important;page-break-inside:avoid!important}
  .brp-head{padding:0 0 .8mm!important;margin:0 0 .8mm!important;min-height:8mm!important}
  .brp-head h1{font-size:13.5pt!important}
  .brp-head p,.brp-legend{font-size:5.8pt!important}
  .brp-week{gap:.9mm!important;margin:0 0 .7mm!important}
  .brp-week div{font-size:5.8pt!important}
  .brp-grid{height:auto!important;min-height:0!important;gap:.9mm!important;grid-template-rows:repeat(var(--brp-weeks),minmax(0,1fr))!important;overflow:hidden!important}
  .brp-cell{min-height:0!important;padding:.9mm!important;border-radius:1.1mm!important;break-inside:avoid!important;overflow:hidden!important}
  .brp-num{font-size:8pt!important;margin-bottom:.45mm!important}
  .brp-entries{gap:.4mm!important}
  .brp-entry{padding:.55mm .75mm!important}
  .brp-entry b{font-size:5.8pt!important}
  .brp-entry .times,.brp-entry .route{font-size:4.8pt!important}
  .brp-entry .flights,.brp-entry em{font-size:4.2pt!important}
}
`;
function markBuild(){
  window.HOMEBASE_BETA_LOADED_BUILD=BUILD;
  window.HOMEBASE_BETA_VERSION=APP_VERSION;
  let badge=document.getElementById('betaTopBuildBadge');
  if(!badge){
    const brand=document.querySelector('.brand');
    if(brand){badge=document.createElement('span');badge.id='betaTopBuildBadge';badge.style.cssText='display:inline-flex;align-items:center;margin-left:6px;padding:2px 6px;border-radius:999px;background:rgba(111,88,201,.12);color:#654fc0;font-size:9px;font-weight:900;line-height:1.2;white-space:nowrap;vertical-align:middle';brand.appendChild(badge)}
  }
  if(badge)badge.textContent=`b${BUILD}`;
  const staticTag=document.getElementById('betaLoadedBuildStatic');
  if(staticTag)staticTag.textContent=`Homebase Beta ${APP_VERSION} · build ${BUILD} · Firebase Beta aislado`;
}
function inject(doc){if(!doc?.head)return;let s=doc.getElementById(STYLE_ID);if(!s){s=doc.createElement('style');s.id=STYLE_ID;doc.head.appendChild(s)}s.textContent=CSS}
function bindFrame(){
 const frame=document.querySelector('#betaRosterPrintOverlay .brp-print-frame');if(!frame)return;
 try{inject(frame.contentDocument)}catch{}
 if(frame.dataset.fit2398==='1')return;
 frame.dataset.fit2398='1';frame.addEventListener('load',()=>{try{inject(frame.contentDocument)}catch{}},{passive:true});
}
function apply(){markBuild();bindFrame()}
function install(){markBuild();const mo=new MutationObserver(()=>setTimeout(apply,0));mo.observe(document.documentElement,{subtree:true,childList:true});document.addEventListener('click',e=>{if(e.target.closest('#betaPrintRoster,#betaRosterPrintOverlay'))setTimeout(apply,0)},true);setTimeout(apply,500)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_PRINT_FIT_FIX={version:VERSION,build:BUILD,apply};
})();
