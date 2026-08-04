(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  const MIGRATION_KEY='homebase_expiry_owner_migration_1_10_18';

  function normalize(value){
    return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function rowName(section){
    const row=section?.previousElementSibling;
    if(!row?.classList?.contains('profile-row'))return '';
    const node=row.querySelector('strong,.event-title,h3,h4');
    return node?.textContent?.trim()||'';
  }

  function repairSection(section){
    if(!section?.classList?.contains('profile-docs'))return;
    const name=rowName(section);
    if(name&&section.dataset.profile!==name)section.dataset.profile=name;
  }

  function repairAll(root=document){
    if(root.matches?.('.profile-docs'))repairSection(root);
    root.querySelectorAll?.('#profileList .profile-docs').forEach(repairSection);
  }

  function hasDavidProfile(){
    try{
      const profiles=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
      return Array.isArray(profiles)&&profiles.some(profile=>normalize(profile?.name)==='david');
    }catch{return false}
  }

  function repairExistingItems(){
    if(localStorage.getItem(MIGRATION_KEY)==='1'||!hasDavidProfile())return;
    let items=[];
    try{items=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return}
    if(!Array.isArray(items)||!items.length){localStorage.setItem(MIGRATION_KEY,'1');return}

    let changed=false;
    for(const title of ['dni','pasaporte']){
      const candidates=items.filter(item=>normalize(item?.profileName)==='familia'&&normalize(item?.title)===title);
      if(candidates.length===1){
        candidates[0].profileName='David';
        candidates[0].updatedAt=Date.now();
        changed=true;
      }
    }

    if(changed){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('homebase:expiries-updated',{detail:{source:'owner-repair'}}));
    }
    localStorage.setItem(MIGRATION_KEY,'1');
  }

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.profile-doc-form');
    if(!form)return;
    repairSection(form.closest('.profile-docs'));
  },true);

  document.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-doc-toggle],[data-doc-add],[data-doc-edit]');
    if(target)repairSection(target.closest('.profile-docs'));
  },true);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1)repairAll(node);
      }
    }
  });

  function init(){
    repairExistingItems();
    repairAll();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();