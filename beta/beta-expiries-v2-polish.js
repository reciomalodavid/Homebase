(()=>{
  'use strict';

  function formatDate(value){
    if(!value)return '';
    const date=new Date(`${value}T12:00:00`);
    if(Number.isNaN(date.getTime()))return '';
    return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date);
  }

  function hideOwnerSelectors(root=document){
    root.querySelectorAll?.('.profile-doc-form').forEach(form=>{
      const select=form.elements?.profileId;
      if(!select)return;
      const wrapper=select.closest('.full')||select.parentElement;
      if(wrapper)wrapper.hidden=true;
    });
  }

  function closeForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.style.setProperty('display','none','important');
    form.reset?.();
  }

  function selectedDate(){
    return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day||'';
  }

  function decorateDates(){
    const iso=selectedDate();
    const dateText=formatDate(iso);
    if(!dateText)return;
    document.querySelectorAll('#selectedDayPanel .expiry-day-meta').forEach(meta=>{
      const parts=meta.textContent.split('·').map(part=>part.trim()).filter(Boolean);
      const clean=parts.filter(part=>!/^\d{1,2}\s+[a-záéíóú]{3,}\s+\d{4}$/i.test(part));
      const owner=clean[0]||'';
      const rest=clean.slice(1).join(' · ');
      meta.textContent=[owner,dateText,rest].filter(Boolean).join(' · ');
      meta.dataset.exactDate=iso;
    });
  }

  document.addEventListener('click',event=>{
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(cancel){
      event.preventDefault();
      event.stopPropagation();
      closeForm(cancel.closest('.profile-doc-form'));
    }
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.profile-doc-form');
    if(!form)return;
    [0,80,220].forEach(ms=>setTimeout(()=>closeForm(form.closest('.profile-docs')?.querySelector('.profile-doc-form')||form),ms));
  },false);

  let scheduled=false;
  function refresh(){
    hideOwnerSelectors();
    decorateDates();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refresh()});
  }

  function init(){
    refresh();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.addEventListener('homebase:expiries-updated',schedule);
    setInterval(schedule,700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();