(()=>{
  'use strict';

  const CATEGORY_LISTS={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['Seguro','Impuesto de circulación','ITV','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Seguro','Revisión veterinaria','Microchip'],
    home:['Seguro del hogar','IBI','Comunidad','Revisión de caldera','Revisión de aire acondicionado','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };

  function normaliseType(value){
    const type=String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(['person','persona','people'].includes(type))return 'person';
    if(['vehicle','vehiculo','vehiculos','car','coche'].includes(type))return 'vehicle';
    if(['pet','mascota','mascotas'].includes(type))return 'pet';
    if(['home','vivienda','casa','hogar'].includes(type))return 'home';
    return 'default';
  }

  function rowForSection(section){
    let node=section?.previousElementSibling||null;
    while(node&&node.parentElement===section?.parentElement){
      if(node.classList?.contains('profile-row'))return node;
      node=node.previousElementSibling;
    }
    return null;
  }

  function rowProfileName(row){
    if(!row)return '';
    const candidates=[...row.querySelectorAll('strong,.event-title,h3,h4')]
      .map(node=>node.textContent.trim()).filter(Boolean);
    return candidates[0]||'';
  }

  function rowProfileType(row){
    const label=row?.textContent||'';
    if(/persona/i.test(label))return 'person';
    if(/veh[ií]culo|coche/i.test(label))return 'vehicle';
    if(/mascota/i.test(label))return 'pet';
    if(/vivienda|casa|hogar/i.test(label))return 'home';
    return 'default';
  }

  function repairSectionIdentity(section){
    if(!section)return {name:'',type:'default'};
    const row=rowForSection(section);
    const name=rowProfileName(row);
    const type=rowProfileType(row);
    if(name)section.dataset.profile=name;
    section.dataset.profileType=type;
    return {name,type};
  }

  function profileTypeForForm(form){
    const section=form.closest('.profile-docs');
    const repaired=repairSectionIdentity(section);
    return repaired.type||normaliseType(section?.dataset.profileType)||'default';
  }

  function enhanceCategoryForm(form,force=false){
    if(!form)return;
    const select=form.elements.category;
    if(!select)return;

    const type=profileTypeForForm(form);
    if(!force&&form.dataset.categoryType===type)return;

    const values=CATEGORY_LISTS[type]||CATEGORY_LISTS.default;
    const current=select.value;
    const customCurrent=current==='__other'||(current&&!values.includes(current));

    select.innerHTML='';
    values.forEach(value=>select.add(new Option(value,value)));
    select.add(new Option('Otro…','__other'));
    select.value=customCurrent?'__other':(values.includes(current)?current:values[0]);
    form.dataset.categoryType=type;
    select.dispatchEvent(new Event('change',{bubbles:true}));
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

  function enhance(root=document,force=false){
    root.querySelectorAll?.('.profile-docs').forEach(repairSectionIdentity);
    root.querySelectorAll?.('.profile-doc-form').forEach(form=>{
      enhanceCategoryForm(form,force);
      enhanceReminderForm(form);
    });
  }

  document.addEventListener('click',event=>{
    const section=event.target.closest('.profile-docs');
    if(!section)return;
    repairSectionIdentity(section);
    if(event.target.closest('[data-doc-add],[data-doc-edit]')){
      requestAnimationFrame(()=>{
        const form=section.querySelector('.profile-doc-form');
        if(form)enhanceCategoryForm(form,true);
      });
    }
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest('.profile-doc-form');
    if(!form)return;
    repairSectionIdentity(form.closest('.profile-docs'));
  },true);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1)enhance(node,true);
      }
    }
  });

  function init(){
    enhance(document,true);
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();