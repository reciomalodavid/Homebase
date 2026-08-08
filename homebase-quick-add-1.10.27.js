(()=>{
'use strict';

const VERSION='1.10.27';
let open=false;
let bypassFab=false;
let installed=false;

const ICONS={
  event:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 8.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  task:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.1V12a9 9 0 1 1-5.3-8.2M21 4l-10 10-3-3"/></svg>',
  birthday:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2ZM4 15h16M8 10V7h8v3M12 7V4M10.7 3.4 12 2l1.3 1.4c.7.8.7 1.9 0 2.6-.7.7-1.9.7-2.6 0-.7-.7-.7-1.8 0-2.6Z"/></svg>'
};

function installStyles(){
  if(document.getElementById('homebaseQuickAddStyles'))return;
  const s=document.createElement('style');
  s.id='homebaseQuickAddStyles';
  s.textContent=`
  #homebaseQuickAddBackdrop{position:fixed;inset:0;z-index:118;background:rgba(238,246,253,.74);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #homebaseQuickAddBackdrop.open{opacity:1;pointer-events:auto}
  #homebaseQuickAddMenu{position:fixed;right:max(18px,calc((100vw - 980px)/2 + 18px));bottom:calc(151px + env(safe-area-inset-bottom));z-index:120;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}
  #homebaseQuickAddMenu.open{pointer-events:auto}
  .homebase-quick-option{display:flex;align-items:center;gap:12px;min-height:55px;padding:0 20px;border:1px solid rgba(73,116,183,.14);border-radius:999px;background:rgba(225,236,255,.96);color:#2450a4;box-shadow:0 10px 30px rgba(38,76,135,.14);font-weight:800;font-size:17px;opacity:0;transform:translateY(16px) scale(.94);transition:opacity .16s ease,transform .2s cubic-bezier(.2,.8,.2,1);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
  #homebaseQuickAddMenu.open .homebase-quick-option{opacity:1;transform:translateY(0) scale(1)}
  #homebaseQuickAddMenu.open .homebase-quick-option:nth-child(1){transition-delay:.06s}#homebaseQuickAddMenu.open .homebase-quick-option:nth-child(2){transition-delay:.035s}#homebaseQuickAddMenu.open .homebase-quick-option:nth-child(3){transition-delay:.01s}
  .homebase-quick-option svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
  .event-fab.homebase-quick-main{z-index:121!important;transition:transform .2s ease,box-shadow .16s ease!important}
  .event-fab.homebase-quick-main.homebase-quick-open{display:grid!important;transform:rotate(45deg)!important}
  @media(max-width:700px){#homebaseQuickAddMenu{right:18px;bottom:calc(154px + env(safe-area-inset-bottom))}.homebase-quick-option{min-height:58px;font-size:18px;padding:0 21px}}
  @media(prefers-reduced-motion:reduce){#homebaseQuickAddBackdrop,.homebase-quick-option,.event-fab.homebase-quick-main{transition:none!important}}
  `;
  document.head.appendChild(s);
}

function closeMenu(){
  open=false;
  document.getElementById('homebaseQuickAddBackdrop')?.classList.remove('open');
  document.getElementById('homebaseQuickAddMenu')?.classList.remove('open');
  const fab=document.querySelector('.event-fab.homebase-quick-main');
  fab?.classList.remove('homebase-quick-open');
  fab?.setAttribute('aria-expanded','false');
}
function openMenu(){
  open=true;
  document.getElementById('homebaseQuickAddBackdrop')?.classList.add('open');
  document.getElementById('homebaseQuickAddMenu')?.classList.add('open');
  const fab=document.querySelector('.event-fab.homebase-quick-main');
  fab?.classList.add('homebase-quick-open');
  fab?.setAttribute('aria-expanded','true');
}

function openExistingEditor(fab){
  bypassFab=true;
  try{fab.click()}finally{setTimeout(()=>{bypassFab=false},0)}
}
function selectEditorType(type){
  const button=document.querySelector(`#editorDialog .type-switch [data-type="${type}"]`);
  if(button)button.click();
}
function openNativeEditor(type='event'){
  const fab=document.querySelector('.event-fab.homebase-quick-main')||document.querySelector('.event-fab');
  if(!fab)return false;
  closeMenu();
  openExistingEditor(fab);
  setTimeout(()=>selectEditorType(type),20);
  return true;
}
function runAction(type,fab){
  closeMenu();
  if(type==='birthday'){
    if(window.HOMEBASE_BIRTHDAYS&&typeof window.HOMEBASE_BIRTHDAYS.open==='function'){
      window.HOMEBASE_BIRTHDAYS.open();
      return;
    }
    console.warn('Birthday module unavailable; falling back to event editor');
    openExistingEditor(fab);
    return;
  }
  openExistingEditor(fab);
  setTimeout(()=>{
    if(type==='task'){
      selectEditorType('task');
      document.getElementById('titleInput')?.focus();
    }
  },40);
}
function install(){
  if(installed)return;
  const fab=document.querySelector('.event-fab');
  if(!fab){setTimeout(install,250);return;}
  installed=true;
  installStyles();
  fab.classList.add('homebase-quick-main');
  fab.setAttribute('aria-label','Crear');
  fab.setAttribute('aria-expanded','false');

  const backdrop=document.createElement('div');
  backdrop.id='homebaseQuickAddBackdrop';
  backdrop.addEventListener('click',closeMenu);
  document.body.appendChild(backdrop);

  const menu=document.createElement('div');
  menu.id='homebaseQuickAddMenu';
  menu.setAttribute('role','menu');
  document.body.appendChild(menu);

  const actions=[['event','Evento'],['task','Pendiente'],['birthday','Cumpleaños']];
  for(const [type,label] of actions){
    const b=document.createElement('button');
    b.type='button';
    b.className='homebase-quick-option';
    b.dataset.quickType=type;
    b.innerHTML=ICONS[type]+`<span>${label}</span>`;
    b.addEventListener('click',()=>runAction(type,fab));
    menu.appendChild(b);
  }

  fab.addEventListener('click',e=>{
    if(bypassFab)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open?closeMenu():openMenu();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)closeMenu()});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_QUICK_ADD={version:VERSION,close:closeMenu,openNativeEditor};
})();
