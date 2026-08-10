(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
let pan=null,lastTap=0;

function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLowerCase()}
function dedupeRoot(root){
  if(!root)return;
  for(const cell of root.querySelectorAll('.hcp-cell')){
    const seen=new Set();
    for(const line of [...cell.querySelectorAll('.hcp-line')]){
      const key=`${[...line.classList].sort().join('.')}:${norm(line.textContent)}`;
      if(seen.has(key))line.remove();else seen.add(key);
    }
  }
  for(const bands of root.querySelectorAll('.hcp-weekbands')){
    const seen=new Set();
    for(const band of [...bands.querySelectorAll('.hcp-band')]){
      const cs=getComputedStyle(band);
      const key=`${norm(band.textContent)}:${cs.getPropertyValue('--c1')}:${cs.getPropertyValue('--c2')}`;
      if(seen.has(key))band.remove();else seen.add(key);
    }
  }
}
function fitScale(){
  const shell=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
  if(!shell)return .5;
  return Math.max(.28,Math.min(.82,(shell.clientWidth-12)/1120));
}
function setScale(scale){
  const preview=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
  const zoom=document.querySelector('#homebaseCalendarPrintOverlay .hcp-zoom');
  if(!preview)return;
  const next=Math.max(.28,Math.min(1.8,scale));
  preview.style.zoom=String(next);
  preview.dataset.previewScale=String(next);
  if(zoom)zoom.textContent=`${Math.round(next*100)}% · pellizca para zoom`;
}
function fitPreview(){
  const shell=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
  if(!shell)return;
  setScale(fitScale());
  shell.scrollLeft=0; shell.scrollTop=0;
}
function currentScale(){
  const preview=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
  const n=Number(preview?.dataset.previewScale||preview?.style.zoom||1);
  return Number.isFinite(n)&&n>0?n:1;
}
function installPan(){
  const shell=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
  if(!shell||shell.dataset.pan2374==='1')return;
  shell.dataset.pan2374='1';
  shell.style.touchAction='none';
  shell.addEventListener('touchstart',e=>{
    if(e.touches.length!==1){pan=null;return;}
    const t=e.touches[0];
    pan={x:t.clientX,y:t.clientY,left:shell.scrollLeft,top:shell.scrollTop,moved:false};
  },{passive:true});
  shell.addEventListener('touchmove',e=>{
    if(e.touches.length!==1||!pan)return;
    const t=e.touches[0],dx=t.clientX-pan.x,dy=t.clientY-pan.y;
    if(Math.abs(dx)>2||Math.abs(dy)>2)pan.moved=true;
    if(currentScale()>fitScale()+.015||shell.scrollWidth>shell.clientWidth+2||shell.scrollHeight>shell.clientHeight+2){
      e.preventDefault();
      shell.scrollLeft=pan.left-dx;
      shell.scrollTop=pan.top-dy;
    }
  },{passive:false});
  shell.addEventListener('touchend',e=>{
    if(e.touches.length) return;
    const now=Date.now();
    if(pan&&!pan.moved&&now-lastTap<320){fitPreview();lastTap=0}else if(pan&&!pan.moved){lastTap=now}
    pan=null;
  },{passive:true});
}
function forceLight(){
  const o=document.getElementById('homebaseCalendarPrintOverlay');
  if(o)o.classList.add('hcp-force-light');
}
function applyPreview(){
  const root=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
  dedupeRoot(root);
  forceLight();installPan();
}
function applyFrame(){
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  try{dedupeRoot(frame?.contentDocument)}catch{}
}
function installStyles(){
  if(document.getElementById('hcp2374Styles'))return;
  const s=document.createElement('style');s.id='hcp2374Styles';s.textContent=`
  #homebaseCalendarPrintOverlay.hcp-force-light{color-scheme:light!important;background:#eef2f6!important;color:#17212b!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-toolbar{background:rgba(255,255,255,.98)!important;color:#17212b!important;border:1px solid rgba(0,0,0,.04)!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-toolbar label{color:#657789!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-toolbar select{background:#fff!important;color:#17212b!important;border:1px solid #d9e0e7!important;-webkit-text-fill-color:#17212b!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-toggle{color:#536271!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-toggle input{appearance:auto!important;accent-color:#3478f6!important;background:#fff!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-close{background:#e4e8ec!important;color:#17212b!important;-webkit-text-fill-color:#17212b!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-print{background:#493991!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-zoom{background:rgba(255,255,255,.94)!important;color:#657789!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-preview-shell{background:#eef2f6!important;overscroll-behavior:contain;cursor:grab}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-preview-shell:active{cursor:grabbing}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-sheet{background:#fff!important;color:#17212b!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-line.all-day{background:color-mix(in srgb,var(--item,#3a7be0) 13%,white)!important;color:#17212b!important;border-left:3px solid var(--item,#3a7be0)!important;box-shadow:none!important}
  #homebaseCalendarPrintOverlay.hcp-force-light .hcp-line.all-day span{color:#657789!important}
  `;document.head.appendChild(s);
}
function install(){
  installStyles();
  document.addEventListener('click',e=>{
    if(e.target.closest('#homebaseCalendarPrintEntry button'))setTimeout(()=>{fitPreview();applyPreview()},80);
  },true);
  document.addEventListener('change',e=>{
    if(e.target.closest('#homebaseCalendarPrintOverlay'))setTimeout(applyPreview,40);
  },true);
  const frameWatch=()=>{
    const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
    if(frame&&frame.dataset.fix2374!=='1'){
      frame.dataset.fix2374='1';frame.addEventListener('load',()=>setTimeout(applyFrame,0));
    }
  };
  window.addEventListener('resize',()=>{const o=document.getElementById('homebaseCalendarPrintOverlay');if(o&&!o.hidden)fitPreview()});
  setTimeout(frameWatch,500);
  document.addEventListener('click',()=>setTimeout(frameWatch,0),true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_PREVIEW_FIXES={version:VERSION,apply:applyPreview,fit:fitPreview};
})();