(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
window.HOMEBASE_BETA_VERSION='2.3.84';
window.HOMEBASE_BETA_LOADED_BUILD=2384;
const VERSION='5';
const ROSTER_CLASSES=['flight','off','vacation','standby','duty','night'];
const STYLE_ID='hcpPrintOrder2384';
const CSS=`
.hcp-line.all-day{min-height:0!important;padding-top:2px!important;padding-bottom:2px!important;overflow:hidden!important}
.hcp-line.all-day b{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.02!important;font-size:7.1px!important;max-height:2.08em!important}
.hcp-line.all-day span{display:none!important}
.hcp-cell.hcp-dense .hcp-num{margin-bottom:1px!important;line-height:1!important}
.hcp-cell.hcp-dense .hcp-lines{gap:1px!important}
.hcp-cell.hcp-very-dense .hcp-line{padding-top:2px!important;padding-bottom:2px!important}
.hcp-cell.hcp-header-share .hcp-num{position:absolute!important;top:5px!important;left:5px!important;margin:0!important;line-height:1!important;z-index:5!important}
.hcp-cell.hcp-header-share .hcp-lines{margin-top:0!important}
.hcp-cell.hcp-header-share .hcp-line:first-child{margin-left:30px!important;min-height:15px!important;padding-top:2px!important;padding-bottom:2px!important}
@media print{
  .hcp-line.all-day{padding-top:.22mm!important;padding-bottom:.22mm!important}
  .hcp-line.all-day b{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:4.65pt!important;line-height:1.01!important;max-height:2.04em!important}
  .hcp-cell.hcp-header-share .hcp-num{top:.9mm!important;left:.9mm!important}
  .hcp-cell.hcp-header-share .hcp-line:first-child{margin-left:6.2mm!important;min-height:3.2mm!important;padding-top:.22mm!important;padding-bottom:.22mm!important}
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
  doc.getElementById('hcpPrintOrder2382')?.remove();
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
function decorateDensity(lines,nodes){
  const cell=lines.closest('.hcp-cell');if(!cell)return;
  cell.classList.remove('hcp-dense','hcp-very-dense','hcp-header-share');
  const count=nodes.length+(lines.querySelector(':scope > .hcp-more')?1:0);
  if(count>=3)cell.classList.add('hcp-dense');
  if(count>=4)cell.classList.add('hcp-very-dense');
  if(count<3||!nodes.length)return;
  const first=nodes[0];
  const shareable=ROSTER_CLASSES.some(c=>first.classList.contains(c))||first.classList.contains('all-day');
  const week=cell.closest('.hcp-weekrow');
  const lanes=Number.parseInt(week?.style?.getPropertyValue('--band-lanes')||'0',10)||0;
  if(shareable&&lanes===0)cell.classList.add('hcp-header-share');
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
    decorateDensity(lines,nodes);
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
  if(!frame||frame.dataset.order2384==='1')return;
  frame.dataset.order2384='1';
  frame.addEventListener('load',schedule,{passive:true});
}
function routeClassicRoster(){
  const mode=document.getElementById('hcpMode');
  if(!mode||mode.value!=='roster')return;
  const classic=window.HOMEBASE_BETA_ROSTER_PRINT;
  if(!classic?.open)return;
  const month=document.getElementById('hcpMonth')?.value||'';
  const overlay=document.getElementById('homebaseCalendarPrintOverlay');
  if(overlay)overlay.hidden=true;
  document.body.style.overflow=document.body.dataset.hcpOverflow||'';
  delete document.body.dataset.hcpOverflow;
  setTimeout(()=>classic.open(month),0);
}
function bindModeRoute(){
  const mode=document.getElementById('hcpMode');
  if(!mode||mode.dataset.classicRoster2383==='1')return;
  mode.dataset.classicRoster2383='1';
  mode.addEventListener('change',()=>{if(mode.value==='roster')routeClassicRoster()});
}
function markBuild(){
  const tag=document.getElementById('betaLoadedBuildStatic');
  if(tag)tag.textContent='Homebase Beta 2.3.84 · build 2384';
}
function install(){
  ensureStyle(document);
  setTimeout(()=>{bindFrame();bindModeRoute();schedule();markBuild()},500);
  setTimeout(markBuild,900);
  document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry,#homebaseCalendarPrintOverlay')){bindFrame();bindModeRoute();schedule()}},true);
  document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay')){bindFrame();schedule()}},true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_ORDER={version:VERSION,apply,routeClassicRoster};
})();