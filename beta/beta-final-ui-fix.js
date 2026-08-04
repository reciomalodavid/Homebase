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
        height:78px!important;
        min-height:78px!important;
        margin:0!important;
        padding:3px 10px 2px!important;
        border-radius:0!important;
        transform:none!important;
        -webkit-transform:none!important;
        align-items:stretch!important;
        z-index:10000!important;
      }
      .bottom-nav .nav-btn{
        min-height:70px!important;
        height:70px!important;
        padding:4px 4px 2px!important;
        margin:0!important;
        justify-content:center!important;
      }
      .bottom-nav .nav-btn span{margin-bottom:1px!important}
      .app{padding-bottom:88px!important}
      .event-fab{bottom:84px!important}
    `;
  }

  function addDates(){
    const items=readItems();
    if(!items.length)return;
    document.querySelectorAll('#selectedDayPanel .expiry-day-row').forEach(row=>{
      const title=norm(row.querySelector('strong')?.textContent);
      const meta=row.querySelector('.expiry-day-meta');
      if(!title||!meta)return;

      const owner=norm((meta.textContent.split('·')[0]||''));
      const candidates=items.filter(item=>norm(item?.title)===title && (!owner || norm(item?.profileName)===owner));
      const item=candidates.find(entry=>entry?.expiryDate) || candidates[0];
      if(!item?.expiryDate)return;

      const exact=formatDate(item.expiryDate);
      if(!exact)return;
      const current=meta.textContent.split('·').map(part=>part.trim()).filter(Boolean);
      const status=current.find(part=>/caduca|caducó|sin fecha/i.test(part))||'';
      const displayOwner=current[0]||item.profileName||'';
      meta.textContent=[displayOwner,exact,status].filter(Boolean).join(' · ');
      meta.dataset.exactExpiryDate=item.expiryDate;
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
    new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.addEventListener('homebase:expiries-updated',refresh);
    setInterval(refresh,500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();