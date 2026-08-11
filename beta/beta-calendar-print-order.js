(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
const ROSTER_CLASSES=['flight','off','vacation','standby','duty','night'];
function rank(line){
  if(ROSTER_CLASSES.some(c=>line.classList.contains(c)))return 10;
  if(line.classList.contains('all-day'))return 20;
  if(line.classList.contains('family'))return 30;
  if(line.classList.contains('expiry'))return 40;
  return 50;
}
function labelExpiry(line){
  if(!line.classList.contains('expiry'))return;
  const b=line.querySelector('b');if(!b)return;
  const raw=String(b.textContent||'').replace(/^\s*⌛\s*/,'').replace(/^\s*Vence\s*[·:-]?\s*/i,'').trim();
  b.textContent=`Vence · ${raw||'Vencimiento'}`;
}
function reorderRoot(root){
  if(!root)return;
  for(const lines of root.querySelectorAll('.hcp-lines')){
    const nodes=[...lines.querySelectorAll(':scope > .hcp-line')];
    nodes.forEach(labelExpiry);
    nodes.sort((a,b)=>rank(a)-rank(b));
    const more=lines.querySelector(':scope > .hcp-more');
    for(const n of nodes)lines.insertBefore(n,more||null);
  }
}
function apply(){
  reorderRoot(document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview'));
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  try{reorderRoot(frame?.contentDocument)}catch{}
}
function schedule(){setTimeout(apply,0);setTimeout(apply,80);setTimeout(apply,180)}
function bindFrame(){
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  if(!frame||frame.dataset.order2380==='1')return;
  frame.dataset.order2380='1';
  frame.addEventListener('load',schedule,{passive:true});
}
function install(){
  setTimeout(()=>{bindFrame();schedule()},500);
  document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry,#homebaseCalendarPrintOverlay')){bindFrame();schedule()}},true);
  document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay')){bindFrame();schedule()}},true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_ORDER={version:VERSION,apply};
})();