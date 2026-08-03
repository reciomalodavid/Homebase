(()=>{
  'use strict';

  const LISTS={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['Seguro','Impuesto de circulación','ITV','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Seguro','Revisión veterinaria','Microchip'],
    home:['Seguro del hogar','IBI','Comunidad','Revisión de caldera','Revisión de aire acondicionado','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };
  let suppressUntil=0;

  const norm=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const canonical=value=>{
    const v=norm(value);
    if(['person','persona','personas','people'].includes(v))return 'person';
    if(['vehicle','vehiculo','vehiculos','coche','coches','car'].includes(v))return 'vehicle';
    if(['pet','mascota','mascotas','animal'].includes(v))return 'pet';
    if(['home','vivienda','viviendas','casa','casas','hogar','piso','pisos'].includes(v))return 'home';
    return '';
  };

  function storedProfiles(){
    try{const data=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');return Array.isArray(data)?data:[]}catch{return []}
  }

  function profileType(section){
    const name=section?.dataset.profile||'';
    const profile=storedProfiles().find(item=>norm(item?.name)===norm(name));
    const stored=canonical(profile?.type);
    if(stored)return stored;
    const row=section?.previousElementSibling;
    const text=norm(row?.textContent||'');
    if(text.includes('mascota')||text.includes('🐾'))return 'pet';
    if(text.includes('vehiculo')||text.includes('coche')||text.includes('🚗'))return 'vehicle';
    if(text.includes('vivienda')||text.includes('casa')||text.includes('piso')||text.includes('hogar')||text.includes('🏠'))return 'home';
    if(text.includes('persona')||text.includes('👤'))return 'person';
    let node=row;
    while(node){
      const heading=norm(node.textContent||'');
      if(heading==='mascotas')return 'pet';
      if(heading==='vehiculos')return 'vehicle';
      if(heading==='viviendas')return 'home';
      if(heading==='personas')return 'person';
      node=node.previousElementSibling;
    }
    return 'default';
  }

  function rebuild(form,preserve=false){
    if(!form?.elements?.category)return;
    const select=form.elements.category;
    const values=LISTS[profileType(form.closest('.profile-docs'))]||LISTS.default;
    const old=preserve?select.value:'';
    select.innerHTML='';
    values.forEach(value=>select.add(new Option(value,value)));
    select.add(new Option('Otro…','__other'));
    select.value=preserve&&(values.includes(old)||old==='__other')?old:values[0];
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function addLongReminders(form){
    const select=form?.elements?.reminderDays;
    if(!select||form.dataset.betaLongReminders==='1')return;
    form.dataset.betaLongReminders='1';
    const insert=(value,label)=>{
      if([...select.options].some(option=>option.value===String(value)))return;
      const option=new Option(label,String(value));
      const before=[...select.options].find(item=>item.value==='90');
      before?select.insertBefore(option,before):select.appendChild(option);
    };
    insert(365,'1 año antes');insert(180,'6 meses antes');
    if(![...select.options].some(option=>option.value==='__custom')){
      const option=new Option('Personalizado…','__custom');
      const noAlert=[...select.options].find(item=>item.value==='-1');
      noAlert?select.insertBefore(option,noAlert):select.appendChild(option);
    }
    const wrap=document.createElement('div');
    wrap.className='profile-doc-reminder-custom';wrap.hidden=true;
    wrap.innerHTML='<label>Días de antelación</label><input type="number" min="1" max="3650" inputmode="numeric" placeholder="Ej. 240">';
    select.insertAdjacentElement('afterend',wrap);
    const input=wrap.querySelector('input');
    select.addEventListener('change',()=>{wrap.hidden=select.value!=='__custom';if(!wrap.hidden)requestAnimationFrame(()=>input.focus())});
    const apply=()=>{const days=Math.max(1,Math.min(3650,Number(input.value)||0));if(!days)return false;let option=[...select.options].find(item=>item.dataset.custom==='1');if(!option){option=new Option('',String(days));option.dataset.custom='1';select.add(option)}option.value=String(days);option.textContent=`${days} días antes`;select.value=String(days);wrap.hidden=true;return true};
    input.addEventListener('change',apply);input.addEventListener('blur',()=>{if(select.value==='__custom')apply()});
    form.addEventListener('submit',event=>{if(select.value==='__custom'&&!apply()){event.preventDefault();input.focus()}},true);
  }

  function hideForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.style.setProperty('display','none','important');
    form.reset();
    const custom=form.querySelector('.profile-doc-custom');if(custom)custom.hidden=true;
    const reminder=form.querySelector('.profile-doc-reminder-custom');if(reminder)reminder.hidden=true;
  }

  function showForm(form){
    if(!form)return;
    form.style.removeProperty('display');form.classList.add('open');rebuild(form,false);addLongReminders(form);
  }

  function closeOthers(current){
    document.querySelectorAll('#profileList .profile-docs').forEach(section=>{
      if(section===current)return;
      section.classList.remove('open');hideForm(section.querySelector('.profile-doc-form'));
    });
  }

  function align(section){
    const row=section?.previousElementSibling||section;
    const modal=section?.closest('.modal');
    if(!row)return;
    const run=()=>{
      if(modal){
        const header=modal.querySelector('.modal-head');
        const modalRect=modal.getBoundingClientRect();
        const rowRect=row.getBoundingClientRect();
        const offset=(header?.getBoundingClientRect().height||0)+12;
        modal.scrollTop=Math.max(0,modal.scrollTop+rowRect.top-modalRect.top-offset);
      }else row.scrollIntoView({block:'start',behavior:'auto'});
    };
    requestAnimationFrame(()=>requestAnimationFrame(run));setTimeout(run,100);setTimeout(run,300);
  }

  function enhance(root=document){
    root.querySelectorAll?.('.profile-doc-form').forEach(form=>{addLongReminders(form);rebuild(form,true)});
  }

  function stop(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()}

  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('.profile-doc-cancel'))stop(event);
    else if(performance.now()<suppressUntil)stop(event);
  },true);

  document.addEventListener('pointerup',event=>{
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(!cancel)return;
    stop(event);suppressUntil=performance.now()+700;
    const form=cancel.closest('.profile-doc-form');
    hideForm(form);requestAnimationFrame(()=>hideForm(form));setTimeout(()=>hideForm(form),120);
  },true);

  document.addEventListener('click',event=>{
    if(performance.now()<suppressUntil){stop(event);return}
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(cancel){stop(event);suppressUntil=performance.now()+700;hideForm(cancel.closest('.profile-doc-form'));return}

    const toggle=event.target.closest?.('[data-doc-toggle]');
    if(toggle){
      const section=toggle.closest('.profile-docs');
      const opening=!section.classList.contains('open');
      closeOthers(section);
      if(opening){
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          section.classList.add('open');const form=section.querySelector('.profile-doc-form');showForm(form);align(section);
        }));
      }
      return;
    }

    const add=event.target.closest?.('[data-doc-add]');
    if(add){
      const section=add.closest('.profile-docs');closeOthers(section);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{section.classList.add('open');showForm(section.querySelector('.profile-doc-form'));align(section)}));
    }
  },true);

  const observer=new MutationObserver(mutations=>mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>{if(node.nodeType===1)enhance(node)})));
  function init(){enhance();observer.observe(document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();