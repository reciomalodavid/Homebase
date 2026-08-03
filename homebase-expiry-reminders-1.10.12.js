(()=>{
  'use strict';

  const CATEGORY_LISTS={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['Seguro','Impuesto de circulación','ITV','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Seguro','Revisión veterinaria','Microchip'],
    home:['Seguro del hogar','IBI','Comunidad','Revisión de caldera','Revisión de aire acondicionado','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };

  function normalize(value){
    return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function typeFromRow(section){
    const row=section?.previousElementSibling;
    const label=normalize(row?.textContent||'');
    if(label.includes('persona'))return 'person';
    if(label.includes('mascota'))return 'pet';
    if(label.includes('vehiculo')||label.includes('coche'))return 'vehicle';
    if(label.includes('vivienda')||label.includes('casa')||label.includes('hogar'))return 'home';
    return '';
  }

  function typeFromStoredProfile(section){
    const name=section?.dataset.profile||'';
    if(!name)return '';
    let profiles=[];
    try{profiles=JSON.parse(localStorage.getItem('homebase_profiles')||'[]')}catch{}
    const profile=Array.isArray(profiles)?profiles.find(item=>item?.name===name):null;
    const type=normalize(profile?.type);
    if(['person','persona','people'].includes(type))return 'person';
    if(['vehicle','vehiculo','vehiculos','car','coche'].includes(type))return 'vehicle';
    if(['pet','mascota','mascotas'].includes(type))return 'pet';
    if(['home','vivienda','casa','hogar'].includes(type))return 'home';
    return '';
  }

  function profileTypeForSection(section){
    return typeFromRow(section)||typeFromStoredProfile(section)||'default';
  }

  function rebuildCategorySelect(form,{preserve=false}={}){
    if(!form)return;
    const select=form.elements.category;
    if(!select)return;
    const section=form.closest('.profile-docs');
    const type=profileTypeForSection(section);
    const values=CATEGORY_LISTS[type]||CATEGORY_LISTS.default;
    const previous=preserve?select.value:'';

    select.innerHTML='';
    values.forEach(value=>select.add(new Option(value,value)));
    select.add(new Option('Otro…','__other'));

    if(preserve&&values.includes(previous))select.value=previous;
    else if(preserve&&previous==='__other')select.value='__other';
    else select.value=values[0];

    form.dataset.categoryType=type;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function closeSection(section){
    if(!section)return;
    section.classList.remove('open');
    const form=section.querySelector('.profile-doc-form');
    if(form){
      form.classList.remove('open');
      form.reset();
      const custom=form.querySelector('.profile-doc-custom');
      if(custom)custom.hidden=true;
    }
  }

  function closeOtherSections(current){
    document.querySelectorAll('#profileList .profile-docs').forEach(section=>{
      if(section!==current)closeSection(section);
    });
  }

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
    root.querySelectorAll?.('.profile-doc-form').forEach(form=>{
      enhanceReminderForm(form);
      rebuildCategorySelect(form,{preserve:true});
    });
  }

  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-doc-toggle]');
    if(toggle){
      const section=toggle.closest('.profile-docs');
      const willOpen=!section?.classList.contains('open');
      closeOtherSections(section);
      if(willOpen)requestAnimationFrame(()=>{
        const form=section?.querySelector('.profile-doc-form');
        if(form)rebuildCategorySelect(form,{preserve:false});
      });
      return;
    }

    const add=event.target.closest('[data-doc-add]');
    if(add){
      const section=add.closest('.profile-docs');
      closeOtherSections(section);
      requestAnimationFrame(()=>{
        const form=section?.querySelector('.profile-doc-form');
        if(!form)return;
        rebuildCategorySelect(form,{preserve:false});
        const custom=form.querySelector('.profile-doc-custom');
        if(custom)custom.hidden=true;
      });
    }
  },true);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1)enhance(node);
      }
    }
  });

  function init(){
    enhance(document);
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();