(()=>{
  'use strict';

  function enhanceReminderForm(form){
    if(!form||form.dataset.longReminders==='1')return;
    const select=form.elements.reminderDays;
    if(!select)return;
    form.dataset.longReminders='1';

    const addOption=(value,label,beforeValue='')=>{
      if([...select.options].some(option=>option.value===String(value)))return;
      const option=new Option(label,String(value));
      const before=[...select.options].find(item=>item.value===beforeValue);
      before?select.insertBefore(option,before):select.appendChild(option);
    };

    addOption(365,'1 año antes','90');
    addOption(180,'6 meses antes','90');

    if(![...select.options].some(option=>option.value==='__custom')){
      const option=new Option('Personalizado…','__custom');
      const noAlert=[...select.options].find(item=>item.value==='-1');
      noAlert?select.insertBefore(option,noAlert):select.appendChild(option);
    }

    const wrap=document.createElement('div');
    wrap.className='profile-doc-reminder-custom';
    wrap.style.display='none';
    wrap.style.marginTop='8px';
    wrap.innerHTML='<label>Días de antelación</label><input type="number" inputmode="numeric" min="1" max="3650" step="1" placeholder="Ej. 240">';
    select.insertAdjacentElement('afterend',wrap);
    const input=wrap.querySelector('input');

    const applyCustom=()=>{
      const days=Math.max(1,Math.min(3650,Number(input.value)||0));
      if(!days)return false;
      let option=[...select.options].find(item=>item.dataset.customReminder==='1');
      if(!option){
        option=new Option('',String(days));
        option.dataset.customReminder='1';
        select.add(option);
      }
      option.value=String(days);
      option.textContent=`${days} días antes`;
      select.value=String(days);
      wrap.style.display='none';
      return true;
    };

    select.addEventListener('change',()=>{
      const custom=select.value==='__custom';
      wrap.style.display=custom?'block':'none';
      if(custom)requestAnimationFrame(()=>input.focus());
    });
    input.addEventListener('change',applyCustom);
    input.addEventListener('blur',()=>{if(select.value==='__custom')applyCustom()});
    form.addEventListener('submit',event=>{
      if(select.value==='__custom'&&!applyCustom()){
        event.preventDefault();
        input.focus();
      }
    },true);
  }

  function enhance(root=document){
    root.querySelectorAll?.('.profile-doc-form').forEach(enhanceReminderForm);
  }

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1)enhance(node);
      }
    }
  });

  function init(){
    enhance();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();