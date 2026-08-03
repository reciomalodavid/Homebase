(()=>{
  'use strict';

  const CATEGORY_LISTS={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['Seguro','Impuesto de circulación','ITV','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Seguro','Revisión veterinaria','Microchip'],
    home:['Seguro del hogar','IBI','Comunidad','Revisión de caldera','Revisión de aire acondicionado','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };

  const cancelledProfiles=new Set();

  function normalize(value){
    return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function canonicalType(value){
    const type=normalize(value);
    if(['person','persona','personas','people'].includes(type))return 'person';
    if(['vehicle','vehiculo','vehiculos','car','coche','coches'].includes(type))return 'vehicle';
    if(['pet','mascota','mascotas','animal'].includes(type))return 'pet';
    if(['home','vivienda','viviendas','casa','casas','hogar','piso','pisos'].includes(type))return 'home';
    return '';
  }

  function typeFromStoredProfile(section){
    const name=section?.dataset.profile||'';
    if(!name)return '';
    let profiles=[];
    try{profiles=JSON.parse(localStorage.getItem('homebase_profiles')||'[]')}catch{}
    const profile=Array.isArray(profiles)?profiles.find(item=>normalize(item?.name)===normalize(name)):null;
    return canonicalType(profile?.type);
  }

  function typeFromOwnRow(section){
    const row=section?.previousElementSibling;
    const label=normalize(row?.textContent||'');
    if(label.includes('mascota')||label.includes('🐾'))return 'pet';
    if(label.includes('vehiculo')||label.includes('coche')||label.includes('🚗'))return 'vehicle';
    if(label.includes('vivienda')||label.includes('casa')||label.includes('hogar')||label.includes('piso')||label.includes('⌂')||label.includes('🏠'))return 'home';
    if(label.includes('persona')||label.includes('👤'))return 'person';
    return '';
  }

  function typeFromGroupHeading(section){
    let node=section?.previousElementSibling||null;
    while(node){
      const text=normalize(node.textContent||'');
      if(/^mascotas?$/.test(text)||text.includes('mascotas'))return 'pet';
      if(/^vehiculos?$/.test(text)||text.includes('vehiculos'))return 'vehicle';
      if(/^viviendas?$/.test(text)||text.includes('viviendas'))return 'home';
      if(/^personas?$/.test(text)||text.includes('personas'))return 'person';
      node=node.previousElementSibling;
    }
    return '';
  }

  function profileTypeForSection(section){
    return typeFromOwnRow(section)||typeFromStoredProfile(section)||typeFromGroupHeading(section)||'default';
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

  function profileKey(section){
    return normalize(section?.dataset.profile||'');
  }

  function resetAndHideForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.style.setProperty('display','none','important');
    form.reset();
    const custom=form.querySelector('.profile-doc-custom');
    if(custom)custom.hidden=true;
    const customReminder=form.querySelector('.profile-doc-reminder-custom');
    if(customReminder)customReminder.style.display='none';
  }

  function showForm(form){
    if(!form)return;
    const section=form.closest('.profile-docs');
    cancelledProfiles.delete(profileKey(section));
    form.style.removeProperty('display');
    form.classList.add('open');
  }

  function closeSection(section){
    if(!section)return;
    section.classList.remove('open');
    resetAndHideForm(section.querySelector('.profile-doc-form'));
  }

  function closeOtherSections(current){
    document.querySelectorAll('#profileList .profile-docs').forEach(section=>{
      if(section!==current)closeSection(section);
    });
  }

  function alignProfileAtTop(section){
    if(!section)return;
    const row=section.previousElementSibling||section;
    const modal=section.closest('.modal');
    const align=()=>{
      const active=document.activeElement;
      if(active&&section.contains(active))active.blur();
      if(modal){
        const modalRect=modal.getBoundingClientRect();
        const rowRect=row.getBoundingClientRect();
        const header=modal.querySelector('.modal-head');
        const headerRect=header?.getBoundingClientRect();
        const headerOffset=headerRect?Math.max(0,headerRect.bottom-modalRect.top)+12:12;
        modal.scrollTop=Math.max(0,modal.scrollTop+(rowRect.top-modalRect.top)-headerOffset);
      }else{
        const y=Math.max(0,window.scrollY+row.getBoundingClientRect().top-12);
        window.scrollTo(0,y);
      }
    };
    requestAnimationFrame(()=>requestAnimationFrame(align));
    setTimeout(align,80);
    setTimeout(align,220);
    setTimeout(align,420);
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
      const section=form.closest('.profile-docs');
      if(cancelledProfiles.has(profileKey(section)))resetAndHideForm(form);
    });
  }

  function cancelForm(cancel,event){
    if(!cancel)return false;
    event?.preventDefault();
    event?.stopImmediatePropagation();
    const form=cancel.closest('.profile-doc-form');
    const section=form?.closest('.profile-docs');
    cancelledProfiles.add(profileKey(section));
    resetAndHideForm(form);
    requestAnimationFrame(()=>resetAndHideForm(form));
    setTimeout(()=>resetAndHideForm(form),50);
    setTimeout(()=>resetAndHideForm(form),180);
    setTimeout(()=>resetAndHideForm(form),400);
    return true;
  }

  const captureCancel=event=>{
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(cancel)cancelForm(cancel,event);
  };

  document.addEventListener('pointerdown',captureCancel,true);
  document.addEventListener('click',event=>{
    const cancel=event.target.closest('.profile-doc-cancel');
    if(cancel){
      cancelForm(cancel,event);
      return;
    }

    const toggle=event.target.closest('[data-doc-toggle]');
    if(toggle){
      const section=toggle.closest('.profile-docs');
      const willOpen=!section?.classList.contains('open');
      closeOtherSections(section);
      if(willOpen){
        cancelledProfiles.delete(profileKey(section));
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          const form=section?.querySelector('.profile-doc-form');
          if(!form)return;
          rebuildCategorySelect(form,{preserve:false});
          showForm(form);
          alignProfileAtTop(section);
        }));
      }
      return;
    }

    const add=event.target.closest('[data-doc-add]');
    if(add){
      const section=add.closest('.profile-docs');
      closeOtherSections(section);
      cancelledProfiles.delete(profileKey(section));
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const form=section?.querySelector('.profile-doc-form');
        if(!form)return;
        rebuildCategorySelect(form,{preserve:false});
        const custom=form.querySelector('.profile-doc-custom');
        if(custom)custom.hidden=true;
        showForm(form);
        alignProfileAtTop(section);
      }));
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