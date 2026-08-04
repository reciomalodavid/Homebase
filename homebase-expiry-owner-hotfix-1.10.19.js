(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  const MIGRATION_KEY='homebase_expiry_owner_hotfix_1_10_19';

  function normalize(value){
    return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function actualRowName(section){
    const row=section?.previousElementSibling;
    if(!row?.classList?.contains('profile-row'))return '';
    return row.querySelector('strong,.event-title,h3,h4')?.textContent?.trim()||'';
  }

  function repairSection(section){
    if(!section?.classList?.contains('profile-docs'))return;
    const name=actualRowName(section);
    if(name)section.dataset.profile=name;
  }

  function repairAll(){
    document.querySelectorAll('#profileList .profile-docs').forEach(repairSection);
  }

  function migrateKnownDocuments(){
    if(localStorage.getItem(MIGRATION_KEY)==='1')return;
    let items=[];
    try{items=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return}
    if(!Array.isArray(items)){localStorage.setItem(MIGRATION_KEY,'1');return}

    const personalDocs=items.filter(item=>['dni','pasaporte'].includes(normalize(item?.title)));
    const noOtherDocs=items.every(item=>['dni','pasaporte'].includes(normalize(item?.title)));
    let changed=false;

    if(noOtherDocs&&personalDocs.length){
      personalDocs.forEach(item=>{
        if(normalize(item.profileName)!=='david'){
          item.profileName='David';
          item.updatedAt=Date.now();
          changed=true;
        }
      });
    }

    if(changed){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('homebase:expiries-updated',{detail:{source:'owner-hotfix'}}));
    }
    localStorage.setItem(MIGRATION_KEY,'1');
  }

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.profile-doc-form');
    if(form)repairSection(form.closest('.profile-docs'));
  },true);

  document.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-doc-toggle],[data-doc-add],[data-doc-edit]');
    if(target)repairSection(target.closest('.profile-docs'));
  },true);

  const observer=new MutationObserver(()=>repairAll());

  function init(){
    migrateKnownDocuments();
    repairAll();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();