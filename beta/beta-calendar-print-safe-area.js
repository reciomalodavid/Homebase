(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
const CSS=`
@page{size:auto!important;margin:10mm!important}
@media print{
  html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;width:auto!important;height:auto!important}
  .hcp-sheet{box-sizing:border-box!important;margin:0 auto!important;padding:0!important;overflow:hidden!important;break-inside:avoid!important;page-break-inside:avoid!important}
  .hcp-head{padding-bottom:1mm!important;margin-bottom:1mm!important}
}
@media print and (orientation:landscape){.hcp-sheet{width:268mm!important;height:189mm!important}}
@media print and (orientation:portrait){.hcp-sheet{width:190mm!important;height:134mm!important}.hcp-head h1{font-size:9pt!important}.hcp-head p{font-size:4.6pt!important}.hcp-weekday div{font-size:4.8pt!important}.hcp-num{font-size:6.8pt!important}.hcp-line b{font-size:4.5pt!important}.hcp-line span{font-size:3.7pt!important}.hcp-band{font-size:4pt!important}}
`;
function patch(doc){if(!doc?.head||doc.getElementById('hcpSafePrint2377'))return;const s=doc.createElement('style');s.id='hcpSafePrint2377';s.textContent=CSS;doc.head.appendChild(s)}
function bind(){const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');if(!f||f.dataset.safe2377==='1')return;f.dataset.safe2377='1';f.addEventListener('load',()=>{try{patch(f.contentDocument)}catch{}},{passive:true});try{patch(f.contentDocument)}catch{}}
function install(){setTimeout(bind,400);document.addEventListener('click',()=>setTimeout(bind,0),true);document.addEventListener('change',()=>setTimeout(bind,0),true)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SAFE_PRINT={version:VERSION};
})();