(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
const STYLE_ID='hcpOverflowFix2385';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').replace(/^\s*⌛\s*/,'').replace(/^\s*Vence\s*[·:-]?\s*/i,'').replace(/\s+/g,' ').trim().toLowerCase();
function expiries(){try{const v=JSON.parse(localStorage.getItem('homebase_expiries_v2')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function month(){return document.getElementById('hcpMonth')?.value||''}
function ensureStyle(doc){if(!doc?.head)return;let s=doc.getElementById(STYLE_ID);if(!s){s=doc.createElement('style');s.id=STYLE_ID;doc.head.appendChild(s)}s.textContent=`
.hcp-weekrow[style*="--band-lanes:1"] .hcp-lines{margin-top:20px!important}
.hcp-cell.hcp-dense .hcp-lines{gap:1px!important}
.hcp-cell.hcp-very-dense .hcp-line{padding-top:1px!important;padding-bottom:1px!important}
.hcp-cell.hcp-very-dense .hcp-line b{line-height:1!important}
/* En días cargados sin bandas largas, el número deja de reservar una fila completa.
   La primera entrada usa el espacio libre a su derecha; el resto vuelve a ancho completo. */
.hcp-cell.hcp-header-share{padding-top:5px!important}
.hcp-cell.hcp-header-share .hcp-num{position:absolute!important;top:5px!important;left:5px!important;margin:0!important;line-height:1!important}
.hcp-cell.hcp-header-share .hcp-lines{margin-top:0!important}
.hcp-cell.hcp-header-share .hcp-line:first-child{margin-left:22px!important}
.hcp-cell.hcp-header-share.hcp-very-dense .hcp-line:first-child{margin-left:20px!important}
@media print{
 .hcp-weekrow[style*="--band-lanes:1"] .hcp-lines{margin-top:4.4mm!important}
 .hcp-cell.hcp-very-dense .hcp-line{padding-top:.12mm!important;padding-bottom:.12mm!important}
 .hcp-cell.hcp-header-share{padding-top:1.1mm!important}
 .hcp-cell.hcp-header-share .hcp-num{top:1.1mm!important;left:1.1mm!important}
 .hcp-cell.hcp-header-share .hcp-line:first-child{margin-left:5.2mm!important}
 .hcp-cell.hcp-header-share.hcp-very-dense .hcp-line:first-child{margin-left:4.7mm!important}
}
`;}
function compactCell(cell){
 const lines=cell.querySelector('.hcp-lines');if(!lines)return;
 const n=lines.querySelectorAll('.hcp-line').length;
 const lanes=Number.parseInt(cell.closest('.hcp-weekrow')?.style?.getPropertyValue('--band-lanes')||'0',10)||0;
 cell.classList.toggle('hcp-dense',n>=3);
 cell.classList.toggle('hcp-very-dense',n>=5);
 cell.classList.toggle('hcp-ultra-dense',n>=8);
 cell.classList.toggle('hcp-header-share',lanes===0&&n>=4);
}
function fixRoot(root,k){if(!root||!/^[0-9]{4}-[0-9]{2}$/.test(k))return;const doc=root.ownerDocument||document;ensureStyle(doc);const list=expiries();for(const cell of root.querySelectorAll('.hcp-cell:not(.hcp-empty)')){const day=Number(cell.querySelector('.hcp-num')?.textContent||0);if(!day)continue;const date=`${k}-${String(day).padStart(2,'0')}`;const due=list.filter(x=>x.expiryDate===date);const lines=cell.querySelector('.hcp-lines');if(!lines)continue;if(due.length){const shown=new Set([...lines.querySelectorAll('.hcp-line.expiry b')].map(b=>norm(b.textContent)));
 for(const x of due){const key=norm(x.title||'Vencimiento');if(shown.has(key))continue;const el=doc.createElement('div');el.className='hcp-line expiry';el.innerHTML=`<b>Vence · ${esc(x.title||'Vencimiento')}</b>${x.profileName?`<span>${esc(x.profileName)}</span>`:''}`;lines.insertBefore(el,lines.querySelector('.hcp-more')||null);shown.add(key)}
 const more=lines.querySelector('.hcp-more');if(more)more.remove();}
 compactCell(cell);}}
function apply(){const k=month();fixRoot(document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview'),k);const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');try{if(frame?.contentDocument)fixRoot(frame.contentDocument,k)}catch{}}
function schedule(){setTimeout(apply,0);setTimeout(apply,80);setTimeout(apply,220)}
function bind(){const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');if(frame&&frame.dataset.overflow2385!=='2'){frame.dataset.overflow2385='2';frame.addEventListener('load',schedule,{passive:true})}}
function install(){ensureStyle(document);setTimeout(()=>{bind();schedule()},500);document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry,#homebaseCalendarPrintOverlay')){bind();schedule()}},true);document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay'))schedule()},true)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_OVERFLOW_FIX={version:VERSION,apply};
})();