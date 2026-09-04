(()=>{
'use strict';
const STYLE_ID='homebaseNotesBadgeStyles';
function byId(id){return document.getElementById(id)}
function installStyles(){
 if(byId(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 .hb-notes-badge{display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:2px 6px;border-radius:999px;background:rgba(217,120,31,.11);color:#a95d17;font-size:10px;font-weight:800;line-height:1.2;vertical-align:middle;white-space:nowrap}
 `;document.head.appendChild(s)
}
function items(){return typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[]}
function mapById(){const m=new Map();for(const i of items()){if(i?.id)m.set(String(i.id),i)}return m}
function hasNotes(i){return !!String(i?.notes||'').trim()}
function addBadge(row,item){
 if(!row||!item||item.source==='roster'||!hasNotes(item))return;
 const title=row.querySelector('.event-title');if(!title||title.querySelector('.hb-notes-badge'))return;
 const b=document.createElement('span');b.className='hb-notes-badge';b.textContent='📝 Notas';title.appendChild(b)
}
function apply(){
 installStyles();const m=mapById();
 document.querySelectorAll('.event-row[data-id]').forEach(row=>addBadge(row,m.get(String(row.dataset.id||''))));
 document.querySelectorAll('.task-row[data-task]').forEach(row=>addBadge(row,m.get(String(row.dataset.task||''))))
}
function schedule(){requestAnimationFrame(()=>requestAnimationFrame(apply));setTimeout(apply,80);setTimeout(apply,250)}
function install(){apply();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_NOTES_BADGES={apply};
})();
