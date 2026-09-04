(()=>{
'use strict';
const STYLE_ID='homebaseNotesBadgeStyles';
const MODAL_ID='homebaseNotesQuickModal';
function byId(id){return document.getElementById(id)}
function installStyles(){
 if(byId(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 .hb-notes-badge{display:inline-flex!important;align-items:center!important;gap:4px!important;width:max-content!important;margin-top:5px!important;margin-left:0!important;padding:2px 7px!important;border:0!important;border-radius:999px!important;background:rgba(217,120,31,.10)!important;color:#a95d17!important;font-size:10px!important;font-weight:800!important;line-height:1.25!important;white-space:nowrap!important;cursor:pointer!important;position:relative!important;z-index:20!important;-webkit-tap-highlight-color:transparent!important}
 .hb-notes-badge::before{content:'📝';font-size:10px;line-height:1}.hb-notes-badge:active{transform:scale(.96)}
 .hb-notes-quick{border:0;padding:0;width:min(calc(100vw - 32px),440px);border-radius:22px;background:#fffdf9;color:#182230;box-shadow:0 22px 70px rgba(31,38,51,.24)}
 .hb-notes-quick::backdrop{background:rgba(20,24,30,.34);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
 .hb-notes-quick-inner{padding:20px}.hb-notes-quick-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.hb-notes-quick-head h3{margin:0;font-size:20px;letter-spacing:-.3px}.hb-notes-quick-close{width:36px;height:36px;border:0;border-radius:50%;background:#f3efe9;color:#182230;font-size:22px;line-height:1}.hb-notes-quick-title{font-size:13px;font-weight:800;color:#7e8793;margin-bottom:8px}.hb-notes-quick-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.45;background:#f7f4ef;border-radius:16px;padding:14px;max-height:52vh;overflow:auto}
 `;document.head.appendChild(s)
}
function items(){return typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]}
function itemId(i){return String(i?.id||i?.uuid||'')}
function hasNotes(i){return !!String(i?.notes||'').trim()}
function mapById(){const m=new Map();for(const i of items()){const id=itemId(i);if(id)m.set(id,i)}return m}
function rowId(row){return String(row?.dataset?.id||row?.dataset?.task||'')}
function ensureModal(){
 let d=byId(MODAL_ID);if(d)return d;
 d=document.createElement('dialog');d.id=MODAL_ID;d.className='hb-notes-quick';
 d.innerHTML='<div class="hb-notes-quick-inner"><div class="hb-notes-quick-head"><h3>📝 Notas</h3><button type="button" class="hb-notes-quick-close" aria-label="Cerrar">×</button></div><div class="hb-notes-quick-title"></div><div class="hb-notes-quick-text"></div></div>';
 document.body.appendChild(d);
 d.querySelector('.hb-notes-quick-close')?.addEventListener('click',()=>d.close());
 d.addEventListener('click',e=>{if(e.target===d)d.close()});
 return d
}
function openNotes(item){
 if(!item||!hasNotes(item))return;
 const d=ensureModal();
 const title=d.querySelector('.hb-notes-quick-title'),text=d.querySelector('.hb-notes-quick-text');
 if(title)title.textContent=String(item.title||'Evento');
 if(text)text.textContent=String(item.notes||'').trim();
 try{if(!d.open)d.showModal()}catch{d.setAttribute('open','')}
}
function applyRow(row,item){
 const badges=[...row.querySelectorAll('.hb-notes-badge')];
 if(!item||item.source==='roster'||!hasNotes(item)){badges.forEach(b=>b.remove());return}
 let badge=badges.shift()||null;badges.forEach(b=>b.remove());
 if(!badge){const meta=row.querySelector('.event-meta');if(!meta)return;badge=document.createElement('button');badge.type='button';badge.className='hb-notes-badge';badge.textContent='Notas';meta.insertAdjacentElement('afterend',badge)}
 if(badge.tagName!=='BUTTON'){const b=document.createElement('button');b.type='button';b.className='hb-notes-badge';b.textContent='Notas';badge.replaceWith(b);badge=b}
 badge.textContent='Notas';badge.setAttribute('aria-label','Leer notas');badge.dataset.hbNotesId=itemId(item)
}
function apply(){
 installStyles();const m=mapById();
 document.querySelectorAll('.event-row[data-id],.task-row[data-task]').forEach(row=>applyRow(row,m.get(rowId(row))))
}
function handleClick(e){
 const badge=e.target?.closest?.('.hb-notes-badge');if(!badge)return;
 const row=badge.closest('.event-row[data-id],.task-row[data-task]');if(!row)return;
 const item=mapById().get(rowId(row));if(!item||!hasNotes(item))return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openNotes(item)
}
function handleKey(e){if((e.key==='Enter'||e.key===' ')&&e.target?.closest?.('.hb-notes-badge'))handleClick(e)}
function schedule(){requestAnimationFrame(()=>requestAnimationFrame(apply));setTimeout(apply,80);setTimeout(apply,250)}
function install(){apply();document.addEventListener('click',handleClick,true);document.addEventListener('keydown',handleKey,true);new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});setInterval(apply,900)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_NOTES_BADGES={apply,openNotes};
})();
