(()=>{
  'use strict';

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
    repairAll();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();