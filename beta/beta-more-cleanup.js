(()=>{
'use strict';

function hideDuplicatePendingBlock(){
  if(!window.HOMEBASE_BETA)return;
  const list=document.getElementById('morePendingTasks');
  if(!list)return;
  const section=list.closest('.section');
  if(!section||section.dataset.betaPendingHidden==='1')return;
  section.dataset.betaPendingHidden='1';
  section.hidden=true;
  section.style.display='none';
}

function init(){
  hideDuplicatePendingBlock();
  const observer=new MutationObserver(()=>hideDuplicatePendingBlock());
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
window.HOMEBASE_BETA_MORE_CLEANUP={version:'1'};
})();
