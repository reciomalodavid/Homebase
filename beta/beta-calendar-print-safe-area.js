(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='3';
const CSS=`
@page{size:auto!important;margin:10mm!important}
@media print{
  html,body{
    margin:0!important;
    padding:0!important;
    background:#fff!important;
    overflow:hidden!important;
    width:100%!important;
    height:100%!important;
    min-width:0!important;
    min-height:0!important;
  }
  .hcp-sheet{
    box-sizing:border-box!important;
    width:100%!important;
    height:100%!important;
    min-width:0!important;
    min-height:0!important;
    max-width:none!important;
    max-height:none!important;
    margin:0!important;
    padding:0!important;
    overflow:hidden!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
    transform:none!important;
    zoom:1!important;
    display:grid!important;
    grid-template-rows:auto minmax(0,1fr)!important;
  }
  .hcp-head{padding-bottom:.8mm!important;margin-bottom:.8mm!important}
  .hcp-head h1{font-size:11pt!important}
  .hcp-head p{font-size:4.8pt!important}
  .hcp-layout,.hcp-calendar,.hcp-weeks,.hcp-weekrow,.hcp-weekcells{min-height:0!important;min-width:0!important}
  .hcp-layout{height:100%!important;overflow:hidden!important}
  .hcp-calendar{height:100%!important;overflow:hidden!important}
  .hcp-weekday{gap:.45mm!important;margin-bottom:.45mm!important}
  .hcp-weekday div{font-size:5pt!important}
  .hcp-weeks{
    height:100%!important;
    overflow:hidden!important;
    gap:.45mm!important;
    grid-template-rows:repeat(var(--weeks),minmax(0,1fr))!important;
  }
  .hcp-weekrow{
    display:grid!important;
    grid-template-rows:auto minmax(0,1fr)!important;
    overflow:hidden!important;
    position:relative!important;
  }
  .hcp-weekbands{
    position:relative!important;
    left:auto!important;
    right:auto!important;
    top:auto!important;
    grid-row:1!important;
    width:100%!important;
    height:calc(var(--band-lanes,0)*2.75mm)!important;
    min-height:0!important;
    margin:0 0 .25mm!important;
    display:grid!important;
    grid-template-columns:repeat(7,minmax(0,1fr))!important;
    overflow:hidden!important;
    pointer-events:none!important;
  }
  .hcp-band{
    top:calc(var(--lane)*2.65mm)!important;
    height:2.45mm!important;
    min-height:2.45mm!important;
    font-size:3.8pt!important;
    line-height:1!important;
    padding:.2mm .5mm!important;
    overflow:hidden!important;
    white-space:nowrap!important;
  }
  .hcp-weekcells{
    grid-row:2!important;
    height:auto!important;
    min-height:0!important;
    gap:.45mm!important;
    overflow:hidden!important;
  }
  .hcp-cell{
    min-height:0!important;
    padding:.55mm!important;
    border-radius:1mm!important;
    overflow:hidden!important;
  }
  .hcp-num{font-size:6.6pt!important;margin-bottom:.2mm!important;line-height:1!important}
  .hcp-lines{
    margin-top:0!important;
    gap:.22mm!important;
    min-height:0!important;
    overflow:hidden!important;
  }
  .hcp-line{
    padding:.24mm .42mm!important;
    line-height:1!important;
    min-height:0!important;
  }
  .hcp-line b{font-size:4.15pt!important;line-height:1.02!important}
  .hcp-line span{font-size:3.35pt!important;line-height:1!important;margin-top:.1mm!important}
  .hcp-cell.hcp-dense .hcp-lines{gap:.16mm!important}
  .hcp-cell.hcp-dense .hcp-line{padding:.18mm .35mm!important}
  .hcp-cell.hcp-dense .hcp-line b{font-size:3.75pt!important}
  .hcp-cell.hcp-dense .hcp-line span{font-size:3.05pt!important}
  .hcp-cell.hcp-very-dense .hcp-lines{gap:.1mm!important}
  .hcp-cell.hcp-very-dense .hcp-line{padding:.12mm .3mm!important}
  .hcp-cell.hcp-very-dense .hcp-line b{font-size:3.35pt!important}
  .hcp-cell.hcp-very-dense .hcp-line span{font-size:2.75pt!important}
  .hcp-cell.hcp-ultra-dense .hcp-lines{gap:0!important}
  .hcp-cell.hcp-ultra-dense .hcp-line{padding:.08mm .24mm!important}
  .hcp-cell.hcp-ultra-dense .hcp-line b{font-size:3pt!important}
  .hcp-cell.hcp-ultra-dense .hcp-line span{font-size:2.45pt!important}
  .hcp-pending{overflow:hidden!important}
}
`;
function patch(doc){
  if(!doc?.head)return;
  doc.getElementById('hcpSafePrint2377')?.remove();
  doc.getElementById('hcpSafePrint2378')?.remove();
  let s=doc.getElementById('hcpSafePrint2379');
  if(!s){s=doc.createElement('style');s.id='hcpSafePrint2379';doc.head.appendChild(s)}
  s.textContent=CSS;
}
function bind(){
  const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  if(!f)return;
  if(f.dataset.safe2379!=='1'){
    f.dataset.safe2379='1';
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