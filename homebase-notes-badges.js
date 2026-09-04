(()=>{
'use strict';
const STYLE_ID='homebaseNotesQuickStyles';
const MODAL_ID='homebaseNotesQuickModal';
function byId(id){return document.getElementById(id)}
function loadDailyQuotes(){
 if(window.HOMEBASE_DAILY_QUOTES||document.querySelector('script[data-homebase-daily-quotes]'))return;
 const s=document.createElement('script');s.src=`./homebase-daily-quotes.js?v=${Date.now()}`;s.dataset.homebaseDailyQuotes='1';document.head.appendChild(s)
}
function installStyles(){
 if(byId(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 .hb-notes-badge{cursor:pointer!important;position:relative!important;z-index:20!important;-webkit-tap-highlight-color:transparent!important}
 .event-row.hb-new-item{background:linear-gradient(90deg,transparent 0,transparent 80px,rgba(247,154,67,.11) 80px,transparent 72%)!important}
 .task-row.hb-new-item{background:linear-gradient(90deg,transparent 0,transparent 44px,rgba(247,154,67,.11) 44px,transparent 72%)!important}
 #todayPage .hero-row>div:first-child{display:flex;align-items:baseline;gap:9px;min-width:0;flex-wrap:nowrap}
 #todayPage .hero-row h1{flex:0 0 auto}
 #todayPage .hero-row .hero-date{margin-top:0;white-space:nowrap;font-size:15px;font-weight:500;line-height:1.2;color:#858b94}
 #todayPage .hero-row .hero-date::before{content:'·';margin-right:8px;color:#c3a78c;font-weight:700}
 .hb-notes-quick{border:0;padding:0;width:min(calc(100vw - 32px),440px);border-radius:22px;background:#fffdf9;color:#182230;box-shadow:0 22px 70px rgba(31,38,51,.24)}
 .hb-notes-quick::backdrop{background:rgba(20,24,30,.34);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
 .hb-notes-quick-inner{padding:20px}.hb-notes-quick-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.hb-notes-quick-head h3{margin:0;font-size:20px;letter-spacing:-.3px}.hb-notes-quick-close{width:36px;height:36px;border:0;border-radius:50%;background:#f3efe9;color:#182230;font-size:22px;line-height:1}.hb-notes-quick-title{font-size:13px;font-weight:800;color:#7e8793;margin-bottom:8px}.hb-notes-quick-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.45;background:#f7f4ef;border-radius:16px;padding:14px;max-height:52vh;overflow:auto}
 @media(max-width:430px){#todayPage .hero-row>div:first-child{gap:7px}#todayPage .hero-row .hero-date{font-size:14px}#todayPage .hero-row .hero-date::before{margin-right:6px}}
 `;document.head.appendChild(s)
}
function items(){return typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]}
function itemId(i){return String(i?.id||i?.uuid||'')}
function rowItem(row){
 if(!row)return null;
 const id=String(row.dataset?.id||row.dataset?.task||'');
 if(!id)return null;
 return items().find(i=>itemId(i)===id)||null
}
function hasNotes(i){return !!String(i?.notes||'').trim()}
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
 const d=ensureModal(),title=d.querySelector('.hb-notes-quick-title'),text=d.querySelector('.hb-notes-quick-text');
 if(title)title.textContent=String(item.title||'Evento');
 if(text)text.textContent=String(item.notes||'').trim();
 try{if(!d.open)d.showModal()}catch{d.setAttribute('open','')}
}
function cleanup(){
 for(const row of document.querySelectorAll('.event-row[data-id],.task-row[data-task]')){
  const badges=[...row.querySelectorAll('.hb-notes-badge')];
  if(!badges.length)continue;
  const keep=badges.shift();badges.forEach(b=>b.remove());
  keep.setAttribute('role','button');keep.setAttribute('tabindex','0');keep.setAttribute('aria-label','Leer notas')
 }
}
function handleClick(e){
 const badge=e.target?.closest?.('.hb-notes-badge');if(!badge)return;
 const row=badge.closest('.event-row[data-id],.task-row[data-task]');
 const item=rowItem(row);if(!item||!hasNotes(item))return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openNotes(item)
}
function handleKey(e){
 if((e.key!=='Enter'&&e.key!==' ')||!e.target?.closest?.('.hb-notes-badge'))return;
 handleClick(e)
}
function apply(){installStyles();cleanup()}
function install(){
 loadDailyQuotes();
 apply();
 document.addEventListener('click',handleClick,true);
 document.addEventListener('keydown',handleKey,true);
 window.addEventListener('pageshow',apply);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
 setTimeout(apply,250)
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_NOTES_BADGES={apply,openNotes,loadDailyQuotes};
})();
