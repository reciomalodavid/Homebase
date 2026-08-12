(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='3',BUILD=2399,APP_VERSION='2.3.99';
const STYLE_ID='brpPrintFit2399';
const PRINT_ZOOM=.88;
const CSS=`
@page{size:A4 landscape;margin:5mm!important}
@media print{
  html{margin:0!important;padding:0!important;width:113.64%!important;height:auto!important;overflow:hidden!important;background:#fff!important;zoom:${PRINT_ZOOM}!important}
  body{margin:0!important;padding:0!important;width:100%!important;height:auto!important;min-height:0!important;overflow:hidden!important;background:#fff!important}
  .brp-sheet{width:100%!important;height:190mm!important;max-height:190mm!important;margin:0!important;padding:0!important;box-shadow:none!important;border-radius:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr)!important;break-inside:avoid!important;page-break-inside:avoid!important}
  .brp-grid{min-height:0!important;overflow:hidden!important;grid-template-rows:repeat(var(--brp-weeks),minmax(0,1fr))!important}
  .brp-cell{min-height:0!important;overflow:hidden!important;break-inside:avoid!important;page-break-inside:avoid!important}
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
function inject(doc){
  if(!doc?.head)return;
  let s=doc.getElementById(STYLE_ID);
  if(!s){s=doc.createElement('style');s.id=STYLE_ID;doc.head.appendChild(s)}
  s.textContent=CSS;
  try{void doc.documentElement.offsetHeight}catch{}
}
function frame(){return document.querySelector('#betaRosterPrintOverlay .brp-print-frame')}
function bindFrame(){
  const f=frame();if(!f)return;
  try{inject(f.contentDocument)}catch{}
  if(f.dataset.fit2399==='1')return;
  f.dataset.fit2399='1';
  f.addEventListener('load',()=>{try{inject(f.contentDocument)}catch{}},{passive:true});
}
function apply(){markBuild();bindFrame()}
function install(){
  markBuild();
  const mo=new MutationObserver(()=>setTimeout(apply,0));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('#betaRosterPrintOverlay .brp-print')){
      const f=frame();try{inject(f?.contentDocument)}catch{}
      return;
    }
    if(e.target.closest('#betaPrintRoster,#betaRosterPrintOverlay'))setTimeout(apply,0);
  },true);
  setTimeout(apply,300);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_PRINT_FIT_FIX={version:VERSION,build:BUILD,apply};
})();
