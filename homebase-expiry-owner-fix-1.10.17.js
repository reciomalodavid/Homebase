(()=>{
  'use strict';
  const STORAGE_KEY='homebase_expiries_v1';

  function readItems(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function normalize(value){
    return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function fixRows(){
    const items=readItems();
    if(!items.length)return;
    document.querySelectorAll('.expiry-day-row').forEach(row=>{
      const title=row.querySelector('strong')?.textContent?.trim()||'';
      const meta=row.querySelector('.expiry-day-meta');
      if(!title||!meta)return;
      const dateHeading=row.closest('.selected-day,.day-detail,.card')?.querySelector('h2,h3,.selected-date-title')?.textContent||'';
      const candidates=items.filter(item=>normalize(item.title)===normalize(title));
      if(!candidates.length)return;
      let item=candidates[0];
      if(candidates.length>1&&dateHeading){
        const dateText=normalize(dateHeading);
        item=candidates.find(candidate=>{
          if(!candidate.expiryDate)return false;
          const date=new Date(`${candidate.expiryDate}T12:00:00`);
          const formatted=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(date);
          return dateText.includes(normalize(formatted));
        })||item;
      }
      if(!item?.profileName)return;
      const parts=meta.textContent.split('·').map(part=>part.trim()).filter(Boolean);
      if(parts.length>1)meta.textContent=`${item.profileName} · ${parts.slice(1).join(' · ')}`;
      else meta.textContent=item.profileName;
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;fixRows()});
  };

  const observer=new MutationObserver(schedule);
  function init(){
    fixRows();
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.addEventListener('homebase:expiries-updated',schedule);
    setInterval(fixRows,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();