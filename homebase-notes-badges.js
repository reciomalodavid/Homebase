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
 #todayPage .hero-row .hero-date{margin-top:0;white-space:nowrap;font-size:17px;font-weight:600;line-height:1.2;color:#737a84}
 #todayPage .hero-row .hero-date::before{content:'·';margin-right:8px;color:#c3a78c;font-weight:700}
 .hb-notes-quick{border:0;padding:0;width:min(calc(100vw - 32px),440px);border-radius:22px;background:#fffdf9;color:#182230;box-shadow:0 22px 70px rgba(31,38,51,.24)}
 .hb-notes-quick::backdrop{background:rgba(20,24,30,.34);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
 .hb-notes-quick-inner{padding:20px}.hb-notes-quick-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.hb-notes-quick-head h3{margin:0;font-size:20px;letter-spacing:-.3px}.hb-notes-quick-close{width:36px;height:36px;border:0;border-radius:50%;background:#f3efe9;color:#182230;font-size:22px;line-height:1}.hb-notes-quick-title{font-size:13px;font-weight:800;color:#7e8793;margin-bottom:8px}.hb-notes-quick-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.45;background:#f7f4ef;border-radius:16px;padding:14px;max-height:52vh;overflow:auto}
 @media(max-width:430px){#todayPage .hero-row>div:first-child{gap:7px}#todayPage .hero-row .hero-date{font-size:16px}#todayPage .hero-row .hero-date::before{margin-right:6px}}
 html.hb-tablet-landscape #newBtn,html.hb-tablet-landscape .hero-row .new-btn{display:none!important}
 html.hb-tablet-landscape .bottom-nav{left:12px!important;right:12px!important;bottom:0!important;transform:none!important;width:calc(100vw - 24px)!important;max-width:calc(100vw - 24px)!important;height:calc(70px + env(safe-area-inset-bottom))!important;min-height:calc(70px + env(safe-area-inset-bottom))!important;padding:7px 7px max(7px,env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 44px minmax(0,1fr) minmax(0,1fr)!important;align-items:start!important;column-gap:0!important;border-radius:30px 30px 0 0!important;overflow:visible!important;background:rgba(255,252,248,.97)!important;border:1px solid rgba(255,255,255,.98)!important;border-bottom:0!important;box-shadow:0 -8px 28px rgba(67,48,31,.09),inset 0 1px 0 rgba(255,255,255,.98)!important;-webkit-backdrop-filter:blur(28px) saturate(170%)!important;backdrop-filter:blur(28px) saturate(170%)!important}
 html.hb-tablet-landscape .bottom-nav::before,html.hb-tablet-landscape .bottom-nav::after{content:none!important;display:none!important}
 html.hb-tablet-landscape .bottom-nav>:nth-child(1){grid-column:1!important}html.hb-tablet-landscape .bottom-nav>:nth-child(2){grid-column:2!important}html.hb-tablet-landscape .bottom-nav>:nth-child(3){grid-column:4!important}html.hb-tablet-landscape .bottom-nav>:nth-child(4){grid-column:5!important}
 html.hb-tablet-landscape .bottom-nav .nav-btn,html.hb-tablet-landscape .bottom-nav button,html.hb-tablet-landscape .bottom-nav a,html.hb-tablet-landscape .bottom-nav .nav-item{position:relative!important;z-index:3!important;min-width:0!important;width:100%!important;height:56px!important;min-height:56px!important;padding:5px 1px!important;border-radius:22px!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
 html.hb-tablet-landscape #eventFab,html.hb-tablet-landscape .event-fab{position:fixed!important;left:50%!important;right:auto!important;bottom:calc(48px + env(safe-area-inset-bottom))!important;width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;margin:0!important;padding:0!important;transform:translateX(-50%)!important;border-radius:50%!important;z-index:940!important;display:grid!important;place-items:center!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important}
 html.hb-tablet-landscape body{padding-bottom:calc(90px + env(safe-area-inset-bottom))!important}
 `;document.head.appendChild(s)
}
function applyTabletNavMode(){
 const isTouch=Number(navigator.maxTouchPoints||0)>1;
 const width=Math.max(window.innerWidth||0,document.documentElement.clientWidth||0);
 document.documentElement.classList.toggle('hb-tablet-landscape',isTouch&&width>1100&&width<=1400)
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
function apply(){installStyles();applyTabletNavMode();cleanup()}
function install(){
 loadDailyQuotes();
 apply();
 document.addEventListener('click',handleClick,true);
 document.addEventListener('keydown',handleKey,true);
 window.addEventListener('pageshow',apply);
 window.addEventListener('resize',applyTabletNavMode);
 window.addEventListener('orientationchange',()=>setTimeout(applyTabletNavMode,80));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
 setTimeout(apply,250)
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_NOTES_BADGES={apply,openNotes,loadDailyQuotes,applyTabletNavMode};
})();
