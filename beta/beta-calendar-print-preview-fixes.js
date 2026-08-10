(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='4';
const BASE_W=1120,BASE_H=792;
let pinch=null,lastTap=0,raf=0;
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
const shell=()=>document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview-shell');
const preview=()=>document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');
function stripTime(v){return norm(v).replace(/^\d{1,2}:\d{2}[–-]\d{1,2}:\d{2}\s+/,'').replace(/\s+cada$/,'').trim()}
function familyKey(line){const title=line.querySelector('b')?.textContent||'',meta=(line.querySelector('span')?.textContent||'').replace(/^Todo el día\s*·\s*/i,'');return `${stripTime(title)}|${norm(meta)}`}
function lineScore(line){const t=line.querySelector('b')?.textContent||'';let s=/\s+cada$/i.test(t.trim())?0:8;const m=t.match(/^(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})/);if(m){const a=+m[1]*60 + +m[2],b=+m[3]*60 + +m[4],d=(b-a+1440)%1440||1440;if(d<=720)s+=4;if(d<=360)s+=2}return s}
function dedupeRoot(root){
  if(!root)return;
  for(const cell of root.querySelectorAll('.hcp-cell')){
    const groups=new Map();
    for(const line of [...cell.querySelectorAll('.hcp-line')]){
      const key=(line.classList.contains('family')||line.classList.contains('all-day'))?`family:${familyKey(line)}`:`${[...line.classList].sort().join('.')}:${norm(line.textContent)}`;
      const prev=groups.get(key);if(!prev){groups.set(key,line);continue}if(lineScore(line)>lineScore(prev)){prev.remove();groups.set(key,line)}else line.remove();
    }
  }
}
function compactRoot(root){if(!root)return;for(const cell of root.querySelectorAll('.hcp-cell')){const n=cell.querySelectorAll('.hcp-line').length;cell.classList.toggle('hcp-dense',n>=4);cell.classList.toggle('hcp-very-dense',n>=6);cell.classList.toggle('hcp-ultra-dense',n>=8)}}
function fitScale(){const s=shell();return s?Math.max(.28,Math.min(.82,(s.clientWidth-12)/BASE_W)):.5}
function currentScale(){const n=Number(preview()?.dataset.previewScale);return Number.isFinite(n)&&n>0?n:fitScale()}
function renderScale(next,anchor,center){
  const s=shell(),p=preview(),sheet=p?.querySelector('.hcp-sheet'),z=document.querySelector('#homebaseCalendarPrintOverlay .hcp-zoom');if(!s||!p||!sheet)return;
  next=Math.max(.28,Math.min(2.2,next));
  p.style.zoom='1';p.style.minWidth='0';p.style.width=`${BASE_W*next}px`;p.style.height=`${BASE_H*next}px`;p.style.position='relative';p.style.margin=BASE_W*next<s.clientWidth?'0 auto':'0';
  sheet.style.position='absolute';sheet.style.inset='0 auto auto 0';sheet.style.margin='0';sheet.style.transformOrigin='0 0';sheet.style.transform=`scale(${next})`;
  p.dataset.previewScale=String(next);
  if(anchor&&center){s.scrollLeft=Math.max(0,anchor.x*next-center.x);s.scrollTop=Math.max(0,anchor.y*next-center.y)}
  if(z)z.textContent=`${Math.round(next*100)}% · pellizca para zoom`;
}
function fitPreview(){const s=shell();if(!s)return;renderScale(fitScale());requestAnimationFrame(()=>{s.scrollLeft=0;s.scrollTop=0})}
const dist=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
function centerOf(a,b,s){const r=s.getBoundingClientRect();return{x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top}}
function installGestures(){
  const s=shell();if(!s||s.dataset.gesture2377==='1')return;s.dataset.gesture2377='1';s.style.touchAction='pan-x pan-y';
  s.addEventListener('touchstart',e=>{
    if(e.touches.length!==2)return;
    e.stopImmediatePropagation();
    const c=centerOf(e.touches[0],e.touches[1],s),scale=currentScale();
    pinch={distance:dist(e.touches[0],e.touches[1]),scale,anchor:{x:(s.scrollLeft+c.x)/scale,y:(s.scrollTop+c.y)/scale}};
  },{capture:true,passive:true});
  s.addEventListener('touchmove',e=>{
    if(e.touches.length!==2||!pinch)return;e.preventDefault();e.stopImmediatePropagation();
    const c=centerOf(e.touches[0],e.touches[1],s),next=pinch.scale*(dist(e.touches[0],e.touches[1])/pinch.distance);
    cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>renderScale(next,pinch?.anchor,c));
  },{capture:true,passive:false});
  s.addEventListener('touchend',e=>{
    if(e.touches.length<2)pinch=null;
    if(e.touches.length===0){const now=Date.now();if(now-lastTap<300){fitPreview();lastTap=0}else lastTap=now}
  },{capture:true,passive:true});
}
function applyPreview(){const root=preview();dedupeRoot(root);compactRoot(root);installGestures()}
function applyFrame(){const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');try{dedupeRoot(f?.contentDocument);compactRoot(f?.contentDocument)}catch{}}
function installStyles(){if(document.getElementById('hcp2377Styles'))return;const s=document.createElement('style');s.id='hcp2377Styles';s.textContent=`
#homebaseCalendarPrintOverlay{color-scheme:light!important;background:#eef2f6!important;color:#17212b!important;overflow:hidden!important}
#homebaseCalendarPrintOverlay .hcp-preview-shell{height:calc(100dvh - 155px)!important;min-height:320px!important;overflow:scroll!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x pan-y!important;overscroll-behavior:contain!important;background:#eef2f6!important;padding-bottom:60px!important}
#homebaseCalendarPrintOverlay .hcp-preview{transform:none!important;transform-origin:0 0!important}
#homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-lines{gap:1px!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-line{padding:2px 3px!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-line b{font-size:7px!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-dense .hcp-line span{font-size:5.8px!important;margin-top:0!important}
#homebaseCalendarPrintOverlay .hcp-cell.hcp-very-dense .hcp-line{padding:1px 2px!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-very-dense .hcp-line b{font-size:6.3px!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-very-dense .hcp-line span{font-size:5.2px!important}
#homebaseCalendarPrintOverlay .hcp-cell.hcp-ultra-dense .hcp-lines{gap:0!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-ultra-dense .hcp-line{padding:1px 2px!important;line-height:1!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-ultra-dense .hcp-line b{font-size:5.7px!important}#homebaseCalendarPrintOverlay .hcp-cell.hcp-ultra-dense .hcp-line span{font-size:4.8px!important}
@media(max-width:700px){#homebaseCalendarPrintOverlay .hcp-preview-shell{height:calc(100dvh - 205px)!important}}
`;document.head.appendChild(s)}
function install(){
  installStyles();
  document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry button'))setTimeout(()=>{applyPreview();fitPreview()},120)},true);
  document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay'))setTimeout(()=>{applyPreview();fitPreview()},60)},true);
  const watch=()=>{const f=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');if(f&&f.dataset.fix2377!=='1'){f.dataset.fix2377='1';f.addEventListener('load',()=>setTimeout(applyFrame,0))}};
  window.addEventListener('resize',()=>{const o=document.getElementById('homebaseCalendarPrintOverlay');if(o&&!o.hidden)fitPreview()});setTimeout(watch,500);document.addEventListener('click',()=>setTimeout(watch,0),true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_PREVIEW_FIXES={version:VERSION,apply:applyPreview,fit:fitPreview};
})();