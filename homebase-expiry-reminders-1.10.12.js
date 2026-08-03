(()=>{
  'use strict';

  const CATEGORY_LISTS={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['Seguro','Impuesto de circulación','ITV','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Seguro','Revisión veterinaria','Microchip'],
    home:['Seguro del hogar','IBI','Comunidad','Revisión de caldera','Revisión de aire acondicionado','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };

  function profiles(){
    try{
      const saved=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
      if(Array.isArray(saved))return saved;
    }catch{}
    return Array.isArray(window.PEOPLE)?window.PEOPLE:[];
  }

  function normaliseType(value){
    const type=String(value||'').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(['person','persona','people'].includes(type))return 'person';
    if(['vehicle','vehiculo','vehiculos','car','coche'].includes(type))return 'vehicle';
    if(['pet','mascota','mascotas'].includes(type))return 'pet';
    if(['home','vivienda','casa','hogar'].includes(type))return 'home';
    return 'default';
  }

  function profileTypeForForm(form){
    const section=form.closest('.profile-docs');
    const name=section?.dataset.profile||'';
    const profile=profiles().find(item=>item?.name===name);
    if(profile?.type)return normaliseType(profile.type);

    const row=section?.previousElementSibling;
    const label=row?.textContent||'';
    if(/persona/i.test(label))return 'person';
    if(/veh[ií]culo|coche/i.test(label))return 'vehicle';
    if(/mascota/i.test(label))return 'pet';
    if(/vivienda|casa|hogar/i.test(label))return 'home';
    return 'default';
  }

  function enhanceCategoryForm(form){
    if(!form||form.dataset.categoryLists==='1')return;
    const select=form.elements.category;
    if(!select)return;

    const type=profileTypeForForm(form);
    const values=CATEGORY_LISTS[type]||CATEGORY_LISTS.default;
    const current=select.value;
    const customCurrent=current==='__other'||(current&&!values.includes(current));

    select.innerHTML='';
    values.forEach(value=>select.add(new Option(value,value)));
    select.add(new Option('Otro…','__other'));
    select.value=customCurrent?'__other':(values.includes(current)?current:values[0]);
    select.dispatchEvent(new Event('change',{bubbles:true}));
    form.dataset.categoryLists='1';
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
      enhanceCategoryForm(form);
      enhanceReminderForm(form);
    });
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