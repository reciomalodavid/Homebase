(()=>{
  'use strict';

  const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function ensureStyles(){
    if(document.getElementById('hb-calendar-jump-style'))return;
    const style=document.createElement('style');
    style.id='hb-calendar-jump-style';
    style.textContent=`
      .calendar-title.hb-jump-ready{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}
      .hb-native-date-trigger{position:relative;display:inline-grid!important;place-items:center;width:48px;height:48px;flex:0 0 48px;border:1px solid color-mix(in srgb,var(--accent,#d9781f) 48%,transparent);border-radius:15px;background:color-mix(in srgb,var(--accent,#d9781f) 12%,var(--surface,#fff));box-shadow:0 5px 14px rgba(0,0,0,.10);overflow:hidden;vertical-align:middle}
      .hb-native-date-trigger::before{content:'📅';display:block;font-size:27px;line-height:1;filter:saturate(1.08)}
      .hb-native-date-trigger:active{transform:scale(.96);background:color-mix(in srgb,var(--accent,#d9781f) 19%,var(--surface,#fff))}
      .hb-native-date-input{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:0!important;opacity:.001!important;cursor:pointer!important;-webkit-appearance:none!important;appearance:none!important;z-index:2}
      .hb-native-date-input::-webkit-calendar-picker-indicator{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;cursor:pointer!important}
    `;
    document.head.appendChild(style);
  }

  function normalize(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }

  function currentMonth(){
    const title=document.querySelector('.calendar-title');
    if(!title)return null;
    const clone=title.cloneNode(true);
    clone.querySelectorAll('.hb-native-date-trigger').forEach(node=>node.remove());
    const match=normalize(clone.textContent||'').match(/([a-z]+)\s+(\d{4})/i);
    if(!match)return null;
    const month=MONTHS.indexOf(match[1]);
    return month<0?null:{year:Number(match[2]),month};
  }

  function localDateValue(year,month,day=1){
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  function jumpTo(year,month){
    const current=currentMonth();
    if(!current)return;
    const delta=(year-current.year)*12+(month-current.month);
    if(!delta)return;
    const buttons=document.querySelectorAll('.calendar-top>button');
    const button=delta>0?buttons[buttons.length-1]:buttons[0];
    if(!button)return;
    let remaining=Math.min(Math.abs(delta),2400);
    const step=()=>{
      const amount=Math.min(remaining,12);
      for(let index=0;index<amount;index++)button.click();
      remaining-=amount;
      if(remaining>0)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function buildTrigger(){
    const trigger=document.createElement('span');
    trigger.className='hb-native-date-trigger';
    trigger.title='Buscar una fecha';
    trigger.setAttribute('aria-label','Abrir calendario para buscar una fecha');

    const input=document.createElement('input');
    input.type='date';
    input.className='hb-native-date-input';
    input.setAttribute('aria-label','Buscar una fecha');

    const prepare=()=>{
      const current=currentMonth()||{year:new Date().getFullYear(),month:new Date().getMonth()};
      input.value=localDateValue(current.year,current.month,1);
    };

    input.addEventListener('pointerdown',prepare,{passive:true});
    input.addEventListener('focus',prepare);
    input.addEventListener('change',()=>{
      if(!input.value)return;
      const [year,month]=input.value.split('-').map(Number);
      jumpTo(year,month-1);
    });

    trigger.appendChild(input);
    return trigger;
  }

  function enhance(){
    ensureStyles();
    const title=document.querySelector('.calendar-title');
    if(!title)return;

    title.classList.add('hb-jump-ready');
    title.setAttribute('aria-label','Mes mostrado y selector de fecha');

    if(!title.querySelector('.hb-native-date-trigger')){
      title.querySelectorAll('.hb-native-date-trigger').forEach(node=>node.remove());
      title.appendChild(buildTrigger());
    }
  }

  let scheduled=false;
  const scheduleEnhance=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;enhance()});
  };

  const observer=new MutationObserver(scheduleEnhance);
  function init(){
    enhance();
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    setInterval(enhance,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();