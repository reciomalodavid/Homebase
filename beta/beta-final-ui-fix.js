(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v2';
  const norm=value=>String(value||'').replace(/^📄\s*/,'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function readItems(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function formatDate(value){
    if(!value)return '';
    const date=new Date(`${value}T12:00:00`);
    if(Number.isNaN(date.getTime()))return '';
    return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date);
  }

  function selectedIsoDate(){
    return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day
      || document.querySelector('.month-grid .day.selected[data-day]')?.dataset.day
      || '';
  }

  function applyStyles(){
    let style=document.getElementById('hb-beta-final-ui-fix');
    if(!style){
      style=document.createElement('style');
      style.id='hb-beta-final-ui-fix';
      document.head.appendChild(style);
    }
    style.textContent=`
      .bottom-nav{
        position:fixed!important;
        left:0!important;
        right:0!important;
        bottom:0!important;
        width:100%!important;
        max-width:none!important;
        height:84px!important;
        min-height:84px!important;
        margin:0!important;
        padding:4px 10px 9px!important;
        border-radius:0!important;
        transform:none!important;
        -webkit-transform:none!important;
        align-items:stretch!important;
        z-index:10000!important;
      }
      .bottom-nav .nav-btn{
        min-height:66px!important;
        height:66px!important;
        padding:4px!important;
        margin:0!important;
        justify-content:center!important;
      }
      .bottom-nav .nav-btn span{margin-bottom:2px!important}
      .app{padding-bottom:94px!important}
      .event-fab{bottom:90px!important}
    `;
  }

  function addDates(){
    const items=readItems();
    const selectedIso=selectedIsoDate();

    document.querySelectorAll('.expiry-day-row').forEach(row=>{
      const title=norm(row.querySelector('strong')?.textContent);
      const meta=row.querySelector('.expiry-day-meta');
      if(!meta)return;

      const current=meta.textContent.split('·').map(part=>part.trim()).filter(Boolean);
      const displayOwner=current[0]||'';
      const status=current.find(part=>/caduca|caducó|sin fecha/i.test(part))||'';

      let expiryDate=selectedIso;
      if(!expiryDate && title){
        const owner=norm(displayOwner);
        const candidates=items.filter(item=>norm(item?.title)===title && (!owner || norm(item?.profileName)===owner));
        expiryDate=(candidates.find(entry=>entry?.expiryDate)||candidates[0])?.expiryDate||'';
      }

      const exact=formatDate(expiryDate);
      if(!exact)return;
      const next=[displayOwner,exact,status].filter(Boolean).join(' · ');
      if(meta.textContent!==next)meta.textContent=next;
      meta.dataset.exactExpiryDate=expiryDate;
    });
  }

  let pending=false;
  function refresh(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{
      pending=false;
      applyStyles();
      addDates();
    });
  }

  function init(){
    refresh();
    new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
    window.addEventListener('homebase:expiries-updated',refresh);
    document.addEventListener('click',event=>{
      if(event.target.closest?.('.day,.nav-btn'))setTimeout(refresh,0);
    },true);
    setInterval(refresh,500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();