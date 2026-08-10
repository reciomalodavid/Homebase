(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
let pinch=null,lastTap=0;
const BASE_W=1120,BASE_H=792;

function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLowerCase()}
function stripTime(title){return norm(title).replace(/^\d{1,2}:\d{2}[–-]\d{1,2}:\d{2}\s+/,'').replace(/\s+cada$/,'').trim()}
function familyKey(line){
  const title=line.querySelector('b')?.textContent||'';
  const meta=(line.querySelector('span')?.textContent||'').replace(/^Todo el día\s*·\s*/i,'');
  return `${stripTime(title)}|${norm(meta)}`;
}
function lineScore(line){
  const title=line.querySelector('b')?.textContent||'';
  let score=0;
  if(!/\s+cada$/i.test(title.trim()))score+=8;
  const m=title.match(/^(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})/);
  if(m){
    const a=Number(m[1])*60+Number(m[2]),b=Number(m[3])*60+Number(m[4]);
    const dur=(b-a+1440)%1440||1440;
    if(dur<=12*60)score+=4;
    if(dur<=6*60)score+=2;
  }
  return score;
}
function dedupeRoot(root){
  if(!root)return;
  for(const cell of root.querySelectorAll('.hcp-cell')){
    const groups=new Map();
    for(const line of [...cell.querySelectorAll('.hcp-line')]){
      let key;
      if(line.classList.contains('family')||line.classList.contains('all-day'))key=`family:${familyKey(line)}`;
      else key=`${[...line.classList].sort().join('.')}:${norm(line.textContent)}`;
      const current=groups.get(key);
      if(!current){groups.set(key,line);continue;}
      if(lineScore(line)>lineScore(current)){current.remove();groups.set(key,line)}else line.remove();
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
  return Math.max(.28,Math.min(.82,(shell.clientWidth-12)/BASE_W));
}
function currentScale(){
  const preview=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
  const n=Number(preview?.dataset.previewScale||fitScale());
  return Number.isFinite(n)&&n>0?n:fitScale();
}
function setScale(scale,center){
  const shell=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
  const preview=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
  const sheet=preview?.querySelector('.hcp-sheet');
  const zoom=document.querySelector('#homebaseCalendarPrintOverlay .hcp-zoom');
  if(!shell||!preview||!sheet)return;
  const old=currentScale(),next=Math.max(.28,Math.min(1.8,scale));
  const focus=center||{x:shell.clientWidth/2,y:shell.clientHeight/2};
  const contentX=(shell.scrollLeft+focus.x)/old,contentY=(shell.scrollTop+focus.y)/old;
  preview.style.zoom='1';
  preview.style.minWidth='0';
  preview.style.width=`${BASE_W*next}px`;
  preview.style.height=`${BASE_H*next}px`;
  preview.style.position='relative';
  preview.style.margin=BASE_W*next<shell.clientWidth?'0 auto':'0';
  sheet.style.position='absolute';sheet.style.left='0';sheet.style.top='0';sheet.style.margin='0';
  sheet.style.transformOrigin='0 0';sheet.style.transform=`scale(${next})`;
  preview.dataset.previewScale=String(next);
  shell.scrollLeft=Math.max(0,contentX*next-focus.x);
  shell.scrollTop=Math.max(0,contentY*next-focus.y);
  if(zoom)zoom.textContent=`${Math.round(next*100)}% · pellizca para zoom`;
}
function fitPreview(){
  const shell=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
  if(!shell)return;
  setScale(fitScale());shell.scrollLeft=0;shell.scrollTop=0;
}
function dist(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
function midpoint(a,b,shell){const r=shell.getBoundingClientRect();return{x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top}}
function installGestures(){
  const shell=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
  if(!shell||shell.dataset.gesture2375==='1')return;
  shell.dataset.gesture2375='1';
  shell.style.touchAction='pan-x pan-y';
  shell.addEventListener('touchstart',e=>{
    if(e.touches.length===2){
      e.stopImmediatePropagation();
      pinch={distance:dist(e.touches[0],e.touches[1]),scale:currentScale(),center:midpoint(e.touches[0],e.touches[1],shell)};
    }
  },{capture:true,passive:true});
  shell.addEventListener('touchmove',e=>{
    if(e.touches.length===2&&pinch){
      e.preventDefault();e.stopImmediatePropagation();
      const center=midpoint(e.touches[0],e.touches[1],shell);
      setScale(pinch.scale*(dist(e.touches[0],e.touches[1])/pinch.distance),center);
    }
  },{capture:true,passive:false});
  shell.addEventListener('touchend',e=>{
    if(e.touches.length<2)pinch=null;
    if(e.touches.length===0){
      const now=Date.now();
      if(now-lastTap<320){fitPreview();lastTap=0}else lastTap=now;
    }
  },{capture:true,passive:true});
}
function compactRoot(root){
  if(!root)return;
  for(const cell of root.querySelectorAll('.hcp-cell')){
    const count=cell.querySelectorAll('.hcp-line').length;
    cell.classList.toggle('hcp-dense',count>=4);
    cell.classList.toggle('hcp-very-dense',count>=6);
  }
}
function applyPreview(){
  const root=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
  dedupeRoot(root);compactRoot(root);installGestures();
}
function applyFrame(){
  const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
  try{dedupeRoot(frame?.contentDocument);compactRoot(frame?.contentDocument)}catch{}
}
function installStyles(){
  if(document.getElementById('hcp2375Styles'))return;
  const s=document.createElement('style');s.id='hcp2375Styles';s.textContent=`
  #homebaseCalendarPrintOverlay{color-scheme:light!important;background:#eef2f6!important;color:#17212b!important}
  #homebaseCalendarPrintOverlay .hcp-toolbar{background:rgba(255,255,255,.98)!important;color:#17212b!important;border:1px solid rgba(0,0,0,.04)!important}
  #homebaseCalendarPrintOverlay .hcp-toolbar label{color:#657789!important}
  #homebaseCalendarPrintOverlay .hcp-toolbar select{background:#fff!important;color:#17212b!important;border:1px solid #d9e0e7!important;-webkit-text-fill-color:#17212b!important;color-scheme:light!important}
  #homebaseCalendarPrintOverlay .hcp-toggle{color:#536271!important}
  #homebaseCalendarPrintOverlay .hcp-toggle input{appearance:auto!important;accent-color:#3478f6!important;background:#fff!important;color-scheme:light!important}
  #homebaseCalendarPrintOverlay .hcp-close{background:#e4e8ec!important;color:#17212b!important;-webkit-text-fill-color:#17212b!important}
  #homebaseCalendarPrintOverlay .hcp-print{background:#493991!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
  #homebaseCalendarPrintOverlay .hcp-zoom{background:rgba(255,255,255,.94)!important;color:#657789!important}
  #homebaseCalendarPrintOverlay .hcp-preview-shell{background:#eef2f6!important;overscroll-behavior:contain;overflow:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x pan-y!important}
  #homebaseCalendarPrintOverlay .hcp-sheet{background:#fff!important;color:#17212b!important}
  #homebaseCalendarPrintOverlay .hcp-line.all-day{background:color-mix(in srgb,var(--item,#3a7be0) 13%,white)!important;color:#17212b!important;box-shadow:none!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-lines{gap:1px!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-line{padding:2px 3px!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-line b{font-size:7px!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-line span{font-size:5.8px!important;margin-top:0!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-very-dense .hcp-line{padding:1px 2px!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-very-dense .hcp-line b{font-size:6.3px!important}
  #homebaseCalendarPrintOverlay .hcp-cell.hcp-very-dense .hcp-line span{font-size:5.2px!important}
  @media print{.hcp-cell.hcp-dense .hcp-lines{gap:.2mm!important}.hcp-cell.hcp-dense .hcp-line{padding:.25mm .4mm!important}.hcp-cell.hcp-dense .hcp-line b{font-size:4.7pt!important}.hcp-cell.hcp-dense .hcp-line span{font-size:3.8pt!important}.hcp-cell.hcp-very-dense .hcp-line{padding:.18mm .3mm!important}.hcp-cell.hcp-very-dense .hcp-line b{font-size:4.2pt!important}.hcp-cell.hcp-very-dense .hcp-line span{font-size:3.5pt!important}}
  `;document.head.appendChild(s);
}
function install(){
  installStyles();
  document.addEventListener('click',e=>{
    if(e.target.closest('#homebaseCalendarPrintEntry button'))setTimeout(()=>{applyPreview();fitPreview()},100);
  },true);
  document.addEventListener('change',e=>{
    if(e.target.closest('#homebaseCalendarPrintOverlay'))setTimeout(()=>{applyPreview();fitPreview()},50);
  },true);
  const frameWatch=()=>{
    const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');
    if(frame&&frame.dataset.fix2375!=='1'){
      frame.dataset.fix2375='1';frame.addEventListener('load',()=>setTimeout(applyFrame,0));
    }
  };
  const observer=new MutationObserver(()=>{const o=document.getElementById('homebaseCalendarPrintOverlay');if(o&&!o.hidden)setTimeout(applyPreview,0)});
  const startObserver=()=>{const o=document.getElementById('homebaseCalendarPrintOverlay');if(o){observer.observe(o,{subtree:true,childList:true});frameWatch()}};
  window.addEventListener('resize',()=>{const o=document.getElementById('homebaseCalendarPrintOverlay');if(o&&!o.hidden)fitPreview()});
  setTimeout(startObserver,500);document.addEventListener('click',()=>setTimeout(()=>{startObserver();frameWatch()},0),true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_PREVIEW_FIXES={version:VERSION,apply:applyPreview,fit:fitPreview};
})();