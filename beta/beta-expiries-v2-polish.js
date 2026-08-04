(()=>{
  'use strict';

  function formatDate(value){
    if(!value)return '';
    const date=new Date(`${value}T12:00:00`);
    if(Number.isNaN(date.getTime()))return '';
    return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date);
  }

  function readItems(){
    try{
      const items=JSON.parse(localStorage.getItem('homebase_expiries_v2')||'[]');
      return Array.isArray(items)?items:[];
    }catch{return []}
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
    form.reset?.();
    const section=form.closest('.profile-docs');
    if(section) section.classList.remove('form-open');
  }

  function decorateDates(){
    const items=readItems();
    document.querySelectorAll('.expiry-day-row').forEach(row=>{
      const title=(row.querySelector('strong')?.textContent||'').replace(/^📄\s*/,'').trim();
      const meta=row.querySelector('.expiry-day-meta');
      if(!title||!meta)return;
      const owner=(meta.textContent.split('·')[0]||'').trim();
      const candidates=items.filter(item=>item?.title===title&&(!owner||item?.profileName===owner));
      const item=candidates.length===1?candidates[0]:candidates.find(entry=>entry?.expiryDate);
      if(!item?.expiryDate)return;
      const dateText=formatDate(item.expiryDate);
      if(!dateText||meta.textContent.includes(dateText))return;
      const parts=meta.textContent.split('·').map(part=>part.trim()).filter(Boolean);
      meta.textContent=parts.length>1?`${parts[0]} · ${dateText} · ${parts.slice(1).join(' · ')}`:`${meta.textContent.trim()} · ${dateText}`;
    });
  }

  document.addEventListener('click',event=>{
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(cancel){
      event.preventDefault();
      event.stopImmediatePropagation();
      closeForm(cancel.closest('.profile-doc-form'));
    }
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.profile-doc-form');
    if(!form)return;
    setTimeout(()=>closeForm(form),0);
  },true);

  const observer=new MutationObserver(()=>{
    hideOwnerSelectors();
    decorateDates();
  });

  function init(){
    hideOwnerSelectors();
    decorateDates();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setInterval(()=>{hideOwnerSelectors();decorateDates()},900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();