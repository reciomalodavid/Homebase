(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
const CSS=`
@page{size:A4 landscape!important;margin:8mm!important}
@media print{
  html,body{
    margin:0!important;
    padding:0!important;
    background:#fff!important;
    overflow:hidden!important;
    width:281mm!important;
    height:194mm!important;
    min-width:281mm!important;
    min-height:194mm!important;
  }
  .hcp-sheet{
    box-sizing:border-box!important;
    width:281mm!important;
    height:194mm!important;
    min-width:281mm!important;
    min-height:194mm!important;
    max-width:281mm!important;
    max-height:194mm!important;
    margin:0!important;
    padding:0!important;
    overflow:hidden!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
    transform:none!important;
    zoom:1!important;
  }
  .hcp-head{padding-bottom:1mm!important;margin-bottom:1mm!important}
  .hcp-head h1{font-size:12pt!important}
  .hcp-head p{font-size:5.2pt!important}
  .hcp-layout,.hcp-calendar,.hcp-weeks,.hcp-weekrow,.hcp-weekcells{min-height:0!important}
  .hcp-weeks{height:100%!important;overflow:hidden!important}
  .hcp-weekrow{overflow:hidden!important}
  .hcp-cell{overflow:hidden!important}
  .hcp-lines{gap:.3mm!important}
  .hcp-line{padding:.32mm .5mm!important;line-height:1!important}
  .hcp-line b{font-size:4.8pt!important;line-height:1.03!important}
  .hcp-line span{font-size:3.9pt!important;line-height:1.02!important;margin-top:.15mm!important}
  .hcp-band{height:2.8mm!important;font-size:4.3pt!important;padding:.25mm .6mm!important}
  .hcp-weekbands{top:6.1mm!important}
  .hcp-lines{margin-top:calc(var(--band-lanes,0)*3.15mm)!important}
  .hcp-cell.hcp-dense .hcp-line b{font-size:4.35pt!important}
  .hcp-cell.hcp-dense .hcp-line span{font-size:3.55pt!important}
  .hcp-cell.hcp-very-dense .hcp-line b{font-size:3.95pt!important}
  .hcp-cell.hcp-very-dense .hcp-line span{font-size:3.2pt!important}
  .hcp-cell.hcp-ultra-dense .hcp-line b{font-size:3.55pt!important}
  .hcp-cell.hcp-ultra-dense .hcp-line span{font-size:2.9pt!important}
}
`;
function patch(doc){
  if(!doc?.head)return;
  let s=doc.getElementById('hcpSafePrint2378');
  if(!s){s=doc.createElement('style');s.id='hcpSafePrint2378';doc.head.appendChild(s)}
  s.textContent=CSS;
  doc.getElementById('hcpSafePrint2377')?.remove();
}
function bind(){
  const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  if(!f)return;
  if(f.dataset.safe2378!=='1'){
    f.dataset.safe2378='1';
    f.addEventListener('load',()=>{try{patch(f.contentDocument)}catch{}},{passive:true});
  }
  try{patch(f.contentDocument)}catch{}
}
function install(){
  setTimeout(bind,350);
  document.addEventListener('click',()=>setTimeout(bind,0),true);
  document.addEventListener('change',()=>setTimeout(bind,0),true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SAFE_PRINT={version:VERSION};
})();