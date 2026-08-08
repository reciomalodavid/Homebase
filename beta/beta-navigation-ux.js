(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';

function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim()}

function renameMoreToManagement(){
  document.querySelectorAll('.bottom-nav .nav-btn,.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item').forEach(item=>{
    const label=[...item.querySelectorAll('span')].find(span=>text(span)==='Más');
    if(label)label.textContent='Gestión';
    else if(text(item)==='Más')item.textContent='Gestión';
  });

  document.querySelectorAll('.page h1,.page .hero-row h1').forEach(title=>{
    if(text(title)==='Más')title.textContent='Gestión';
  });
}

function pendingPage(){
  const heading=[...document.querySelectorAll('.page h1,.page .hero-row h1')].find(el=>text(el)==='Pendientes');
  return heading?.closest('.page')||null;
}

function hidePendingHeroNewButton(){
  const page=pendingPage();
  if(!page)return;
  page.querySelectorAll('button,.new-btn,#newBtn').forEach(button=>{
    const label=text(button).replace(/^\+\s*/,'').trim();
    if(label==='Nuevo'){
      button.hidden=true;
      button.style.setProperty('display','none','important');
      button.setAttribute('aria-hidden','true');
    }
  });
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
