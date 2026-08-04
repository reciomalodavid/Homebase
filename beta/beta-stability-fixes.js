(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v2';

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

  function normalize(value){
    return String(value||'').replace(/^📄\s*/,'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function selectedDate(){
    return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day||'';
  }

  function addExactDates(){
    const items=readItems();
    if(!items.length)return;
    const dateIso=selectedDate();
    document.querySelectorAll('.expiry-day-row').forEach(row=>{
      const title=normalize(row.querySelector('strong')?.textContent);
      const meta=row.querySelector('.expiry-day-meta');
      if(!title||!meta)return;
      const candidates=items.filter(item=>normalize(item?.title)===title&&(!dateIso||item?.expiryDate===dateIso));
      if(!candidates.length)return;
      const item=candidates[0];
      const exact=formatDate(item.expiryDate);
      if(!exact)return;
      const parts=meta.textContent.split('·').map(part=>part.trim()).filter(Boolean);
      if(parts.some(part=>normalize(part)===normalize(exact)))return;
      const owner=parts[0]||item.profileName||'';
      const status=parts.slice(1).join(' · ');
      meta.textContent=[owner,exact,status].filter(Boolean).join(' · ');
    });
  }

  function hideForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.reset?.();
    const custom=form.querySelector('.profile-doc-custom');
    if(custom)custom.hidden=true;
  }

  function hideAllForms(except=null){
    document.querySelectorAll('.profile-doc-form.open').forEach(form=>{
      if(form!==except)hideForm(form);
    });
  }

  function installStyles(){
    if(document.getElementById('hb-beta-stability-style'))return;
    const style=document.createElement('style');
    style.id='hb-beta-stability-style';
    style.textContent=`
      .profile-doc-form [name="profileId"]{display:none!important}
      .profile-doc-form [name="profileId"]+*{display:none!important}
      .profile-doc-form label:has(+ select[name="profileId"]){display:none!important}
      .bottom-nav{z-index:10000!important;pointer-events:auto!important;isolation:isolate!important;touch-action:manipulation!important;-webkit-transform:translateX(-50%) translateZ(0)!important;transform:translateX(-50%) translateZ(0)!important}
      .bottom-nav .nav-btn{position:relative!important;z-index:2!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:58px!important;padding:8px 4px!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
      .bottom-nav .nav-btn span{pointer-events:none!important}
      dialog[open]{z-index:20000!important}
    `;
    document.head.appendChild(style);
  }

  function closeOpenDialogsOnNavigation(){
    document.querySelectorAll('dialog[open]').forEach(dialog=>{
      try{dialog.close()}catch{dialog.removeAttribute('open')}
    });
  }

  function installEvents(){
    document.addEventListener('click',event=>{
      const add=event.target.closest?.('[data-doc-add]');
      if(add){
        const section=add.closest('.profile-docs');
        const form=section?.querySelector('.profile-doc-form');
        hideAllForms(form);
        return;
      }

      const cancel=event.target.closest?.('.profile-doc-cancel');
      if(cancel){
        const form=cancel.closest('.profile-doc-form');
        setTimeout(()=>hideForm(form),0);
        return;
      }

      const nav=event.target.closest?.('.bottom-nav .nav-btn');
      if(nav){
        closeOpenDialogsOnNavigation();
        event.stopPropagation();
      }
    });

    document.addEventListener('submit',event=>{
      const form=event.target.closest?.('.profile-doc-form');
      if(!form)return;
      const profileId=form.closest('.profile-docs')?.dataset.profileId||'';
      setTimeout(()=>{
        hideForm(form);
        if(profileId){
          const current=document.querySelector(`.profile-docs[data-profile-id="${CSS.escape(profileId)}"] .profile-doc-form`);
          hideForm(current);
        }
        addExactDates();
      },30);
    });

    document.addEventListener('pointerup',event=>{
      const nav=event.target.closest?.('.bottom-nav .nav-btn');
      if(nav)event.stopPropagation();
    });
  }

  let scheduled=false;
  function scheduleRefresh(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      installStyles();
      addExactDates();
    });
  }

  function init(){
    installStyles();
    installEvents();
    addExactDates();
    new MutationObserver(scheduleRefresh).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.addEventListener('homebase:expiries-updated',scheduleRefresh);
    setInterval(scheduleRefresh,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();