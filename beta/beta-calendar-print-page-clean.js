(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const STYLE_ID='hcpPrintPageClean2386';
const CSS=`
@page{size:A4 landscape;margin:0!important}
@media print{
  html,body{margin:0!important;padding:0!important;width:297mm!important;height:210mm!important;overflow:hidden!important}
  .hcp-sheet{width:297mm!important;height:210mm!important;padding:4mm!important;margin:0!important}
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
  if(frame&&frame.dataset.pageClean2386!=='1'){
    frame.dataset.pageClean2386='1';
    frame.addEventListener('load',()=>setTimeout(apply,0),{passive:true});
  }
}
function install(){inject(document);setTimeout(()=>{bind();apply()},500);document.addEventListener('click',()=>setTimeout(()=>{bind();apply()},0),true);document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay'))setTimeout(apply,0)},true)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_PAGE_CLEAN={version:'1',apply};
})();
