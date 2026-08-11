(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='3';
const ROSTER_CLASSES=['flight','off','vacation','standby','duty','night'];
const STYLE_ID='hcpPrintOrder2382';
const CSS=`
.hcp-line.all-day{min-height:0!important;padding-top:2px!important;padding-bottom:2px!important;overflow:hidden!important}
.hcp-line.all-day b{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.02!important;font-size:7.1px!important;max-height:2.08em!important}
.hcp-line.all-day span{display:none!important}
@media print{
  .hcp-line.all-day{padding-top:.22mm!important;padding-bottom:.22mm!important}
  .hcp-line.all-day b{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:4.65pt!important;line-height:1.01!important;max-height:2.04em!important}
}
`;
function rank(line){
  if(ROSTER_CLASSES.some(c=>line.classList.contains(c)))return 10;
  if(line.classList.contains('all-day'))return 20;
  if(line.classList.contains('family'))return 30;
  if(line.classList.contains('expiry'))return 40;
  return 50;
}
function ensureStyle(doc){
  if(!doc?.head)return;
  doc.getElementById('hcpPrintOrder2381')?.remove();
  let s=doc.getElementById(STYLE_ID);
  if(!s){s=doc.createElement('style');s.id=STYLE_ID;doc.head.appendChild(s)}
  s.textContent=CSS;
}
function labelExpiry(line){
  if(!line.classList.contains('expiry'))return;
  const b=line.querySelector('b');if(!b)return;
  const raw=String(b.textContent||'').replace(/^\s*⌛\s*/,'').replace(/^\s*Vence\s*[·:-]?\s*/i,'').trim();
  b.textContent=`Vence · ${raw||'Vencimiento'}`;
}
function flattenAllDay(line){
  if(!line.classList.contains('all-day'))return;
  const b=line.querySelector('b');if(!b)return;
  const span=line.querySelector('span');
  const title=String(b.textContent||'Evento').trim();
  const meta=String(span?.textContent||'').replace(/^\s*Todo el día\s*[·:-]?\s*/i,'').trim();
  const full=meta?`${title} · ${meta}`:title;
  b.textContent=full;
  b.title=full;
  if(span)span.remove();
}
function reorderRoot(root){
  if(!root)return;
  const doc=root.ownerDocument||document;ensureStyle(doc);
  for(const lines of root.querySelectorAll('.hcp-lines')){
    const nodes=[...lines.querySelectorAll(':scope > .hcp-line')];
    nodes.forEach(n=>{labelExpiry(n);flattenAllDay(n)});
    nodes.sort((a,b)=>rank(a)-rank(b));
    const more=lines.querySelector(':scope > .hcp-more');
    for(const n of nodes)lines.insertBefore(n,more||null);
  }
}
function apply(){
  reorderRoot(document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview'));
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  try{if(frame?.contentDocument){ensureStyle(frame.contentDocument);reorderRoot(frame.contentDocument)}}catch{}
}
function schedule(){setTimeout(apply,0);setTimeout(apply,80);setTimeout(apply,180)}
function bindFrame(){
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  if(!frame||frame.dataset.order2382==='1')return;
  frame.dataset.order2382='1';
  frame.addEventListener('load',schedule,{passive:true});
}
function install(){
  ensureStyle(document);
  setTimeout(()=>{bindFrame();schedule()},500);
  document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry,#homebaseCalendarPrintOverlay')){bindFrame();schedule()}},true);
  document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay')){bindFrame();schedule()}},true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_ORDER={version:VERSION,apply};
})();