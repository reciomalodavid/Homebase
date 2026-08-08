(()=>{
'use strict';

const VERSION='1';
let open=false;
let bypassFab=false;
let installed=false;

const ICONS={
  event:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 8.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  task:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.1V12a9 9 0 1 1-5.3-8.2M21 4l-10 10-3-3"/></svg>',
  birthday:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2ZM4 15h16M8 10V7h8v3M12 7V4M10.7 3.4 12 2l1.3 1.4c.7.8.7 1.9 0 2.6-.7.7-1.9.7-2.6 0-.7-.7-.7-1.8 0-2.6Z"/></svg>'
};

function norm(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&!el.hidden}
function buttons(){return [...document.querySelectorAll('button,[role="button"]')].filter(visible)}
function findButton(words,exclude){
  const wanted=words.map(norm),blocked=(exclude||[]).map(norm);
  return buttons().find(el=>{const t=norm(el.textContent||el.getAttribute('aria-label')||el.title);return wanted.some(w=>t===w||t.includes(w))&&!blocked.some(w=>t.includes(w));})||null;
}

function findAction(type){
  if(type==='task') return findButton(['nueva tarea','crear tarea','añadir tarea','agregar tarea','tarea'],['complet','filtro']);
  if(type==='birthday') return findButton(['nuevo cumpleaños','crear cumpleaños','añadir cumpleaños','cumpleaños'],['proximo']);
  return null;
}

function installStyles(){
  if(document.getElementById('betaQuickAddStyles'))return;
  const s=document.createElement('style');
  s.id='betaQuickAddStyles';
  s.textContent=`
  #betaQuickAddBackdrop{position:fixed;inset:0;z-index:118;background:rgba(238,246,253,.74);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #betaQuickAddBackdrop.open{opacity:1;pointer-events:auto}
  #betaQuickAddMenu{position:fixed;right:max(18px,calc((100vw - 980px)/2 + 18px));bottom:calc(84px + env(safe-area-inset-bottom));z-index:120;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}
  #betaQuickAddMenu.open{pointer-events:auto}
  .beta-quick-option{display:flex;align-items:center;gap:12px;min-height:55px;padding:0 20px;border:1px solid rgba(73,116,183,.14);border-radius:999px;background:rgba(225,236,255,.96);color:#2450a4;box-shadow:0 10px 30px rgba(38,76,135,.14);font-weight:800;font-size:17px;opacity:0;transform:translateY(16px) scale(.94);transition:opacity .16s ease,transform .2s cubic-bezier(.2,.8,.2,1);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
  #betaQuickAddMenu.open .beta-quick-option{opacity:1;transform:translateY(0) scale(1)}
  #betaQuickAddMenu.open .beta-quick-option:nth-child(1){transition-delay:.06s}#betaQuickAddMenu.open .beta-quick-option:nth-child(2){transition-delay:.035s}#betaQuickAddMenu.open .beta-quick-option:nth-child(3){transition-delay:.01s}
  .beta-quick-option svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
  .event-fab.beta-quick-main{z-index:121!important;transition:transform .2s ease,box-shadow .16s ease!important}
  .event-fab.beta-quick-main.beta-quick-open{transform:rotate(45deg)!important}
  @media(max-width:700px){#betaQuickAddMenu{right:18px}.beta-quick-option{min-height:58px;font-size:18px;padding:0 21px}}
  @media(prefers-reduced-motion:reduce){#betaQuickAddBackdrop,.beta-quick-option,.event-fab.beta-quick-main{transition:none!important}}
  `;
  document.head.appendChild(s);
}

function closeMenu(){
  open=false;
  document.getElementById('betaQuickAddBackdrop')?.classList.remove('open');
  document.getElementById('betaQuickAddMenu')?.classList.remove('open');
  document.querySelector('.event-fab.beta-quick-main')?.classList.remove('beta-quick-open');
}
function openMenu(){
  open=true;
  document.getElementById('betaQuickAddBackdrop')?.classList.add('open');
  document.getElementById('betaQuickAddMenu')?.classList.add('open');
  document.querySelector('.event-fab.beta-quick-main')?.classList.add('beta-quick-open');
}

function runExisting(type,fab){
  closeMenu();
  if(type==='event'){
    bypassFab=true;
    try{fab.click()}finally{setTimeout(()=>{bypassFab=false},0)}
    return;
  }
  const target=findAction(type);
  if(target){target.click();return;}
  // Fallback: open the existing create dialog, then choose its own type switch if present.
  bypassFab=true;
  try{fab.click()}finally{setTimeout(()=>{bypassFab=false},0)}
  setTimeout(()=>{
    const label=type==='task'?'tarea':'cumpleaños';
    const candidate=findButton([label],['guardar','eliminar','complet']);
    if(candidate)candidate.click();
  },50);
}

function install(){
  if(installed)return;
  const fab=document.querySelector('.event-fab');
  if(!fab){setTimeout(install,250);return;}
  installed=true;installStyles();fab.classList.add('beta-quick-main');fab.setAttribute('aria-label','Crear');fab.setAttribute('aria-expanded','false');

  const backdrop=document.createElement('div');backdrop.id='betaQuickAddBackdrop';backdrop.addEventListener('click',closeMenu);document.body.appendChild(backdrop);
  const menu=document.createElement('div');menu.id='betaQuickAddMenu';menu.setAttribute('role','menu');document.body.appendChild(menu);

  const actions=[
    ['birthday','Cumpleaños'],
    ['task','Tarea'],
    ['event','Evento']
  ];
  for(const [type,label] of actions){
    const b=document.createElement('button');b.type='button';b.className='beta-quick-option';b.dataset.quickType=type;b.innerHTML=ICONS[type]+`<span>${label}</span>`;b.addEventListener('click',()=>runExisting(type,fab));menu.appendChild(b);
  }

  fab.addEventListener('click',e=>{
    if(bypassFab)return;
    e.preventDefault();e.stopImmediatePropagation();
    open?closeMenu():openMenu();
    fab.setAttribute('aria-expanded',String(open));
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)closeMenu()});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_QUICK_ADD={version:VERSION,close:closeMenu};
})();