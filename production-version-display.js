(()=>{
'use strict';
const OPENED_KEY_PREFIX='homebase_unread_opened_v3_';
const MIGRATION_KEY_PREFIX='homebase_unread_migrated_v3_';
let unreadGuardInstalled=false;
function loadNotesBadges(){
 if(document.querySelector('script[data-homebase-notes-badges]'))return;
 const s=document.createElement('script');s.src=`./homebase-notes-badges.js?v=${Date.now()}`;s.dataset.homebaseNotesBadges='1';document.head.appendChild(s)
}
function homeKey(){
 try{return String((typeof state!=='undefined'&&state.syncCode)||localStorage.getItem('homebase_sync_code')||'local')}catch{return 'local'}
}
function openedKey(){return OPENED_KEY_PREFIX+homeKey()}
function migrationKey(){return MIGRATION_KEY_PREFIX+homeKey()}
function loadOpened(){try{return new Set(JSON.parse(localStorage.getItem(openedKey())||'[]'))}catch{return new Set()}}
function saveOpened(set){try{localStorage.setItem(openedKey(),JSON.stringify([...set].slice(-2500)))}catch{}}
function eligible(item){
 if(!item||item.deletedAt||item.source==='roster')return false;
 const meta=`${item.type||''} ${item.source||''} ${item.category||''}`.toLowerCase();
 if(meta.includes('birthday')||meta.includes('cumple'))return false;
 return item.type==='task'||!!item.date
}
function currentIds(){
 try{return (typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]).filter(eligible).map(item=>String(item?.id||item?.uuid||'')).filter(Boolean)}catch{return []}
}
function markOpened(id){
 id=String(id||'');if(!id)return;
 const opened=loadOpened();opened.add(id);saveOpened(opened);
 try{window.HOMEBASE_MOBILE_NAV?.unread?.markSeen?.(id)}catch{}
}
function reconcileUnreadState(){
 const unread=window.HOMEBASE_MOBILE_NAV?.unread;if(!unread?.markSeen)return false;
 const opened=loadOpened();
 for(const id of opened)unread.markSeen(id);
 try{
  if(localStorage.getItem(migrationKey())!=='1'){
   for(const id of currentIds()){opened.add(id);unread.markSeen(id)}
   saveOpened(opened);localStorage.setItem(migrationKey(),'1')
  }
 }catch{}
 return true
}
function handleUnreadOpen(e){
 if(e.target?.closest?.('[data-delete],[data-check],.hb-notes-badge'))return;
 const row=e.target?.closest?.('.event-row[data-id],.all-day-item[data-id],.time-event[data-id],.mobile-time-event[data-id],.ongoing-card[data-id],.task-row[data-task]');
 if(!row)return;
 const id=row.dataset.id||row.dataset.task;if(!id)return;
 markOpened(id);setTimeout(reconcileUnreadState,0)
}
function installUnreadGuard(){
 if(unreadGuardInstalled)return;unreadGuardInstalled=true;
 document.addEventListener('click',handleUnreadOpen,true);
 let tries=0;const timer=setInterval(()=>{tries++;if(reconcileUnreadState()||tries>30)clearInterval(timer)},120);
 window.addEventListener('pageshow',()=>setTimeout(reconcileUnreadState,80));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(reconcileUnreadState,80)})
}
async function apply(){
 try{
  const response=await fetch(`./homebase-version.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;
  const data=await response.json();const el=document.getElementById('productionAppVersion');if(el)el.textContent=`Homebase ${data.version||'?'} · build ${data.build||'?'}`;
 }catch{}
 loadNotesBadges();installUnreadGuard();
}
function start(){loadNotesBadges();installUnreadGuard();apply();setTimeout(apply,500)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_VERSION_DISPLAY={apply,loadNotesBadges,reconcileUnreadState,markOpened};
})();