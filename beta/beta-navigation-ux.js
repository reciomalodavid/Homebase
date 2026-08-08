(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='2';

function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim()}

function renameMoreToManagement(){
  const nav=document.querySelector('.bottom-nav [data-page="morePage"]');
  if(nav){
    const icon=nav.querySelector('span');
    nav.childNodes.forEach(node=>{
      if(node.nodeType===Node.TEXT_NODE && node.textContent.trim()==='Más')node.textContent='Gestión';
    });
    nav.setAttribute('aria-label','Gestión');
    if(icon&&text(nav).includes('Más')){
      nav.innerHTML=icon.outerHTML+'Gestión';
    }
  }

  const title=document.querySelector('#morePage .hero-row h1,#morePage h1');
  if(title&&text(title)==='Más')title.textContent='Gestión';
}

function pendingPage(){return document.getElementById('tasksPage')}

function hidePendingHeroNewButton(){
  const page=pendingPage();
  if(!page)return;
  const button=page.querySelector('#newTask,.new-btn');
  if(button){
    button.hidden=true;
    button.style.setProperty('display','none','important');
    button.setAttribute('aria-hidden','true');
  }
}

function keepGlobalQuickAddVisible(){
  const fab=document.querySelector('.event-fab');
  if(!fab)return;
  fab.hidden=false;
  fab.removeAttribute('aria-hidden');
  fab.style.setProperty('display','grid','important');
  fab.style.setProperty('visibility','visible','important');
  fab.style.setProperty('opacity','1','important');
  fab.style.setProperty('pointer-events','auto','important');
}

function apply(){
  renameMoreToManagement();
  hidePendingHeroNewButton();
  keepGlobalQuickAddVisible();
}

function applyAfterNavigation(){
  requestAnimationFrame(()=>requestAnimationFrame(apply));
  setTimeout(apply,120);
}

function install(){
  apply();
  document.addEventListener('click',event=>{
    if(event.target.closest('.bottom-nav'))applyAfterNavigation();
  },true);
  window.addEventListener('pageshow',applyAfterNavigation);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAfterNavigation()});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_NAVIGATION_UX={version:VERSION,apply};
})();
