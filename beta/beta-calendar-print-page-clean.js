(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const STYLE_ID='hcpPrintPageClean2396';
const CSS=`
@page{size:A4 landscape;margin:8mm!important}
@media print{
  html,body{
    margin:0!important;
    padding:0!important;
    width:auto!important;
    height:auto!important;
    overflow:visible!important;
    background:#fff!important;
  }
  body{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
  .hcp-sheet{
    box-sizing:border-box!important;
    width:281mm!important;
    height:194mm!important;
    max-width:281mm!important;
    max-height:194mm!important;
    padding:3mm!important;
    margin:0!important;
    overflow:hidden!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
    break-after:avoid!important;
    page-break-after:avoid!important;
  }
  .hcp-head{padding-bottom:1.5mm!important;margin-bottom:1.5mm!important}
  .hcp-head h1{font-size:20px!important}
  .hcp-weekday{margin-bottom:1mm!important}
  .hcp-weeks{gap:1mm!important}
  .hcp-weekcells{gap:1mm!important}
  .hcp-cell{padding:1.1mm!important}
}
`;
function inject(doc){
  if(!doc?.head)return;
  let s=doc.getElementById(STYLE_ID);
  if(!s){s=doc.createElement('style');s.id=STYLE_ID;doc.head.appendChild(s)}
  s.textContent=CSS;
}
function apply(){
  inject(document);
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  try{inject(frame?.contentDocument)}catch{}
}
function bind(){
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  if(frame&&frame.dataset.pageClean2396!=='1'){
    frame.dataset.pageClean2396='1';
    frame.addEventListener('load',()=>setTimeout(apply,0),{passive:true});
  }
}
function install(){inject(document);setTimeout(()=>{bind();apply()},500);document.addEventListener('click',()=>setTimeout(()=>{bind();apply()},0),true);document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay'))setTimeout(apply,0)},true)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_PAGE_CLEAN={version:'2',apply};
})();
