(()=>{
  'use strict';

  const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function ensureStyles(){
    if(document.getElementById('hb-calendar-jump-style'))return;
    const style=document.createElement('style');
    style.id='hb-calendar-jump-style';
    style.textContent=`
      .calendar-title.hb-jump-ready{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}
      .hb-native-date-trigger{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:48px!important;height:48px!important;min-width:48px!important;flex:0 0 48px!important;padding:0!important;border:1px solid color-mix(in srgb,var(--accent,#d9781f) 52%,transparent)!important;border-radius:15px!important;background:color-mix(in srgb,var(--accent,#d9781f) 13%,var(--surface,#fff))!important;color:var(--accent,#d9781f)!important;box-shadow:0 5px 14px rgba(0,0,0,.10)!important;cursor:pointer!important;position:relative!important;z-index:20!important}
      .hb-native-date-trigger svg{display:block!important;width:27px!important;height:27px!important;stroke:currentColor!important;stroke-width:2.2!important;fill:none!important;pointer-events:none!important}
      .hb-native-date-trigger:active{transform:scale(.96)}
      .hb-native-date-input{position:fixed!important;left:-9999px!important;top:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
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

  function ensureInput(){
    let input=document.getElementById('hbNativeDateInput');
    if(input)return input;
    input=document.createElement('input');
    input.id='hbNativeDateInput';
    input.type='date';
    input.className='hb-native-date-input';
    input.setAttribute('aria-label','Buscar una fecha');
    input.addEventListener('change',()=>{
      if(!input.value)return;
      const [year,month]=input.value.split('-').map(Number);
      jumpTo(year,month-1);
    });
    document.body.appendChild(input);
    return input;
  }

  function openNativePicker(){
    const input=ensureInput();
    const current=currentMonth()||{year:new Date().getFullYear(),month:new Date().getMonth()};
    input.value=localDateValue(current.year,current.month,1);
    try{
      if(typeof input.showPicker==='function')input.showPicker();
      else input.click();
    }catch{
      input.click();
    }
  }

  function buildTrigger(){
    const button=document.createElement('button');
    button.type='button';
    button.className='hb-native-date-trigger';
    button.title='Buscar una fecha';
    button.setAttribute('aria-label','Abrir calendario para buscar una fecha');
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M8 3v4M16 3v4M3 10h18"></path><path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2M15 17h2"></path></svg>';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      openNativePicker();
    });
    return button;
  }

  function enhance(){
    ensureStyles();
    ensureInput();
    const title=document.querySelector('.calendar-title');
    if(!title)return;
    title.classList.add('hb-jump-ready');
    title.setAttribute('aria-label','Mes mostrado y selector de fecha');
    if(!title.querySelector('.hb-native-date-trigger'))title.appendChild(buildTrigger());
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
    setInterval(enhance,800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();