(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='2';

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function fold(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function profileNames(){
  try{
    const p=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
    if(Array.isArray(p))return p.filter(x=>x?.name).map(x=>fold(x.name));
  }catch{}
  return [];
}
function externalBirthdayTitle(title){
  const t=clean(title);
  const m=t.match(/^Cumplea(?:ños|nos)\s+de\s+(.+)$/i);
  if(!m)return false;
  const name=fold(m[1]);
  return !!name&&!profileNames().includes(name);
}
function cleanMeta(meta){
  if(!meta)return;
  const raw=clean(meta.textContent);
  if(!/Familia/i.test(raw))return;
  const cleaned=raw
    .replace(/^Familia\s*·\s*/i,'')
    .replace(/\s*·\s*Familia$/i,'')
    .replace(/^Familia$/i,'')
    .replace(/\s*·\s*·\s*/g,' · ')
    .trim();
  meta.textContent=cleaned;
  meta.style.display=cleaned?'':'none';
}
function cleanRows(){
  for(const row of document.querySelectorAll('.event-row')){
    const title=clean(row.querySelector('.event-title')?.textContent);
    if(!externalBirthdayTitle(title))continue;
    row.dataset.externalBirthday='true';
    row.querySelectorAll('.event-meta').forEach(cleanMeta);
    row.querySelectorAll('.avatar-stack,.avatar').forEach(el=>el.style.setProperty('display','none','important'));
  }
}
function cleanDetail(){
  const dialog=document.getElementById('detailDialog');
  if(!dialog?.open)return;
  const title=clean(document.getElementById('detailTitle')?.textContent);
  if(!externalBirthdayTitle(title))return;
  const grid=document.getElementById('detailGrid');
  if(!grid)return;
  for(const child of [...grid.children]){
    const text=clean(child.textContent);
    if(/^PARA/i.test(text)&&/Familia/i.test(text))child.style.setProperty('display','none','important');
  }
}
function apply(){cleanRows();cleanDetail()}
function install(){
  apply();
  const root=document.querySelector('.app')||document.body;
  const observer=new MutationObserver(()=>apply());
  observer.observe(root,{subtree:true,childList:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(apply,20),true);
  window.addEventListener('pageshow',()=>setTimeout(apply,20));
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_EXTERNAL_BIRTHDAY_DISPLAY={version:VERSION,apply};
})();
