(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
function closeCalendarPrint(){
  const overlay=document.getElementById('homebaseCalendarPrintOverlay');
  if(overlay)overlay.hidden=true;
  if(document.body.dataset.hcpOverflow!==undefined){
    document.body.style.overflow=document.body.dataset.hcpOverflow||'';
    delete document.body.dataset.hcpOverflow;
  }
}
function route(){
  const mode=document.getElementById('hcpMode');
  if(!mode||mode.value!=='roster')return;
  const month=document.getElementById('hcpMonth')?.value||'';
  const classic=window.HOMEBASE_BETA_ROSTER_PRINT;
  if(!classic?.open)return;
  closeCalendarPrint();
  setTimeout(()=>classic.open(month),0);
}
function bind(){
  const mode=document.getElementById('hcpMode');
  if(!mode||mode.dataset.classicRosterRoute==='1')return;
  mode.dataset.classicRosterRoute='1';
  mode.addEventListener('change',()=>{if(mode.value==='roster')setTimeout(route,0)});
}
function install(){
  setTimeout(bind,500);
  document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry,#homebaseCalendarPrintOverlay'))setTimeout(bind,0)},true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_ROSTER_ROUTER={version:VERSION,route};
})();
