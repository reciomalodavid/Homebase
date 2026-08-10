(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const fold=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const parse=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?new Date(`${s}T12:00:00`):null;
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const people=i=>Array.isArray(i?.people)&&i.people.length?i.people:[i?.person||'Familia'];
function items(){try{if(typeof state!=='undefined'&&Array.isArray(state.items))return state.items}catch{}return[]}
function family(){return items().filter(i=>i&&!i.deletedAt&&i.source!=='roster'&&i.type!=='task'&&i.date)}
function occurs(i,dateIso){try{if(typeof matches==='function')return !!matches(i,dateIso)}catch{}const d=parse(dateIso),s=parse(i.date);if(!d||!s||d<s)return false;if(i.repeatUntil&&dateIso>i.repeatUntil)return false;if(Array.isArray(i.exceptions)&&i.exceptions.includes(dateIso))return false;if(i.repeat==='weekly'){const days=Array.isArray(i.repeatDays)&&i.repeatDays.length?i.repeatDays:[s.getDay()];return days.includes(d.getDay())}if(i.repeat==='monthly')return d.getDate()===s.getDate();if(i.repeat==='yearly')return d.getDate()===s.getDate()&&d.getMonth()===s.getMonth();const e=parse(i.endDate||i.date)||s;return d>=s&&d<=e}
function isLong(i){const s=parse(i.date),e=parse(i.endDate||i.date);return !!(s&&e&&iso(s)!==iso(e)&&(i.repeat==='none'||!i.repeat))}
function baseTitle(i){return fold(i.title).replace(/\s+cada$/,'').trim()}
function logicalKey(i,dateIso){return `${dateIso}|${baseTitle(i)}|${people(i).map(fold).sort().join(',')}`}
function duration(i){if(!i.time||!i.endTime)return i.allDay?0:9999;const [ah,am]=i.time.split(':').map(Number),[bh,bm]=i.endTime.split(':').map(Number);if([ah,am,bh,bm].some(Number.isNaN))return 9999;return ((bh*60+bm)-(ah*60+am)+1440)%1440||1440}
function score(i){let s=0;if(!/\s+cada$/i.test(clean(i.title)))s+=20;const d=duration(i);if(d<=12*60)s+=6;if(d<=6*60)s+=4;if(i.allDay)s+=2;return s}
function uniqueFor(dateIso){const groups=new Map();for(const i of family()){if(isLong(i)||!occurs(i,dateIso))continue;const k=logicalKey(i,dateIso),prev=groups.get(k);if(!prev||score(i)>score(prev))groups.set(k,i)}return [...groups.values()].sort((a,b)=>Number(!!b.allDay)-Number(!!a.allDay)||(a.time||'99:99').localeCompare(b.time||'99:99')||clean(a.title).localeCompare(clean(b.title),'es'))}
function color(i){return i.eventColor||'#3a7be0'}
function html(i){const timed=!i.allDay&&i.time;const t=timed?[i.time,i.endTime].filter(Boolean).join('–')+' ':'';const meta=i.allDay?['Todo el día',people(i).join(', ')].filter(Boolean).join(' · '):people(i).join(', ');return `<div class="hcp-line ${i.allDay?'all-day':'family'}" style="--item:${esc(color(i))}"><b>${esc(t+(i.title||'Evento'))}</b>${meta?`<span>${esc(meta)}</span>`:''}</div>`}
function rebuild(root){
  if(!root)return;
  const month=document.querySelector('#hcpMonth')?.value||'';
  const mode=document.querySelector('#hcpMode')?.value||'combined';
  if(!/^\d{4}-\d{2}$/.test(month)||mode==='roster')return;
  for(const cell of root.querySelectorAll('.hcp-cell:not(.hcp-empty)')){
    const day=Number(cell.querySelector('.hcp-num')?.textContent||0);if(!day)continue;
    const dateIso=`${month}-${String(day).padStart(2,'0')}`;
    const lines=cell.querySelector('.hcp-lines');if(!lines)continue;
    lines.querySelectorAll('.hcp-line.family,.hcp-line.all-day').forEach(n=>n.remove());
    const insertBefore=lines.querySelector('.hcp-line.flight,.hcp-line.off,.hcp-line.vacation,.hcp-line.standby,.hcp-line.duty,.hcp-line.night,.hcp-line.expiry,.hcp-more');
    const holder=document.createElement('div');holder.innerHTML=uniqueFor(dateIso).map(html).join('');
    const nodes=[...holder.children];
    for(const n of nodes)lines.insertBefore(n,insertBefore||null);
    const more=lines.querySelector('.hcp-more');if(more)more.remove();
    const count=lines.querySelectorAll('.hcp-line').length;
    cell.classList.toggle('hcp-dense',count>=4);cell.classList.toggle('hcp-very-dense',count>=6);
  }
}
function apply(){const p=document.querySelector('#homebaseCalendarPrintOverlay .hcp-preview');rebuild(p);const frame=document.querySelector('#homebaseCalendarPrintOverlay .hcp-frame');try{rebuild(frame?.contentDocument)}catch{}}
function install(){
  const watch=()=>{const o=document.getElementById('homebaseCalendarPrintOverlay');if(!o)return;const mo=new MutationObserver(()=>{if(!o.hidden)setTimeout(apply,0)});mo.observe(o,{subtree:true,childList:true});const f=o.querySelector('.hcp-frame');if(f)f.addEventListener('load',()=>setTimeout(apply,0));};
  setTimeout(watch,600);
  document.addEventListener('click',e=>{if(e.target.closest('#homebaseCalendarPrintEntry,#homebaseCalendarPrintOverlay'))setTimeout(apply,80)},true);
  document.addEventListener('change',e=>{if(e.target.closest('#homebaseCalendarPrintOverlay'))setTimeout(apply,60)},true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_CALENDAR_PRINT_CONTENT_FIXES={version:VERSION,apply};
})();