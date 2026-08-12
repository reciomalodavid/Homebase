(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1',BUILD=2397,APP_VERSION='2.3.97';
const STYLE_ID='brpPrintFit2397';
const CSS=`
@page{size:A4 landscape;margin:7mm!important}
@media print{
  html,body{margin:0!important;padding:0!important;width:auto!important;height:auto!important;overflow:hidden!important;background:#fff!important}
  .brp-sheet{width:100%!important;height:170mm!important;max-height:170mm!important;margin:0!important;padding:0!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto auto 1fr!important;break-inside:avoid!important;page-break-inside:avoid!important}
  .brp-head{padding:0 0 1mm!important;margin:0 0 1mm!important;min-height:9mm!important}
  .brp-head h1{font-size:14pt!important}
  .brp-head p,.brp-legend{font-size:6pt!important}
  .brp-week{gap:1mm!important;margin:0 0 .8mm!important}
  .brp-week div{font-size:6pt!important}
  .brp-grid{height:146mm!important;min-height:0!important;gap:1mm!important;grid-template-rows:repeat(var(--brp-weeks),1fr)!important}
  .brp-cell{min-height:0!important;padding:1mm!important;border-radius:1.2mm!important;break-inside:avoid!important}
  .brp-num{font-size:8.5pt!important;margin-bottom:.55mm!important}
  .brp-entries{gap:.45mm!important}
  .brp-entry{padding:.65mm .85mm!important}
  .brp-entry b{font-size:6pt!important}
  .brp-entry .times,.brp-entry .route{font-size:5pt!important}
  .brp-entry .flights,.brp-entry em{font-size:4.4pt!important}
}
`;
function markBuild(){
  window.HOMEBASE_BETA_LOADED_BUILD=BUILD;
  window.HOMEBASE_BETA_VERSION=APP_VERSION;
  const old=document.getElementById('betaTopBuildBadge');
  if(!old){
    const brand=document.querySelector('.brand');
    if(brand){
      const badge=document.createElement('span');
      badge.id='betaTopBuildBadge';
      badge.textContent=`b${BUILD}`;
      badge.style.cssText='display:inline-flex;align-items:center;margin-left:6px;padding:2px 6px;border-radius:999px;background:rgba(111,88,201,.12);color:#654fc0;font-size:9px;font-weight:900;line-height:1.2;white-space:nowrap;vertical-align:middle';
      brand.appendChild(badge);
    }
  }
  const staticTag=document.getElementById('betaLoadedBuildStatic');
  if(staticTag)staticTag.textContent=`Homebase Beta ${APP_VERSION} · build ${BUILD} · Firebase Beta aislado`;
}
function inject(doc){
  if(!doc?.head)return;
  let s=doc.getElementById(STYLE_ID);
  if(!s){s=doc.createElement('style');s.id=STYLE_ID;doc.head.appendChild(s)}
  s.textContent=CSS;
}
function bindFrame(){
  const frame=document.querySelector('#betaRosterPrintOverlay .brp-print-frame');
  if(!frame)return;
  try{inject(frame.contentDocument)}catch{}
  if(frame.dataset.fit2397==='1')return;
  frame.dataset.fit2397='1';
  frame.addEventListener('load',()=>{try{inject(frame.contentDocument)}catch{}},{passive:true});
}
function apply(){markBuild();bindFrame()}
function install(){
  markBuild();
  const mo=new MutationObserver(()=>setTimeout(apply,0));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',e=>{if(e.target.closest('#betaPrintRoster,#betaRosterPrintOverlay'))setTimeout(apply,0)},true);
  setTimeout(apply,500);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_PRINT_FIT_FIX={version:VERSION,build:BUILD,apply};
})();
