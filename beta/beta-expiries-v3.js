(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v2';
  const DAY_MS=86400000;
  const CATEGORIES={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['ITV','Seguro','Impuesto de circulación','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Microchip','Seguro','Revisión veterinaria'],
    home:['Seguro del hogar','IBI','Comunidad','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };

  let items=[];
  let editingId='';
  let activeProfileId='';
  let observer=null;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]);
  const norm=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const slug=value=>norm(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'perfil';
  const uid=()=>crypto.randomUUID?.()||`exp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function rawProfiles(){
    try{
      const stored=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
      if(Array.isArray(stored)&&stored.length)return stored;
    }catch{}
    return Array.isArray(window.PEOPLE)?window.PEOPLE:[];
  }

  function profiles(){
    const seen=new Map();
    return rawProfiles().map((profile,index)=>{
      const name=String(profile?.name||`Perfil ${index+1}`).trim();
      const type=profile?.type||'default';
      const base=String(profile?.id||profile?.uuid||`${type}:${slug(name)}`);
      const count=seen.get(base)||0;
      seen.set(base,count+1);
      return {...profile,name,type,stableId:count?`${base}:${count+1}`:base};
    });
  }

  function profileById(id){return profiles().find(profile=>profile.stableId===id)||null}
  function profileByName(name){const found=profiles().filter(profile=>norm(profile.name)===norm(name));return found.length===1?found[0]:null}
  function profileColor(id){return profileById(id)?.color||'#3a7be0'}
  function categoryList(id){return CATEGORIES[profileById(id)?.type||'default']||CATEGORIES.default}

  function load(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      if(Array.isArray(value))return value;
    }catch{}
    return [];
  }

  function persist(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('homebase:expiries-updated',{detail:{source:'beta-v3'}}));
    renderCalendarMarkers();
    renderSelectedDay();
  }

  function parseDate(value){
    if(!value)return null;
    const date=new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())?null:date;
  }

  function formatDate(value){
    const date=parseDate(value);
    return date?new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date):'Sin fecha';
  }

  function statusFor(item){
    const date=parseDate(item.expiryDate);
    if(!date)return {key:'none',label:'Sin fecha'};
    const today=new Date();today.setHours(12,0,0,0);
    const days=Math.round((date-today)/DAY_MS);
    if(days<0)return {key:'expired',label:`Caducó hace ${Math.abs(days)} días`};
    if(days===0)return {key:'urgent',label:'Caduca hoy'};
    if(days<=30)return {key:'urgent',label:`Caduca en ${days} días`};
    if(days<=90)return {key:'soon',label:`Caduca en ${days} días`};
    return {key:'ok',label:`Caduca en ${days} días`};
  }

  function ensureStyles(){
    if(document.getElementById('hb-expiries-v3-styles'))return;
    const style=document.createElement('style');
    style.id='hb-expiries-v3-styles';
    style.textContent=`
      #expiryPanel{display:none!important}
      .profile-docs{margin:-2px 0 12px;padding:0 12px 12px;border:1px solid var(--line,rgba(0,0,0,.08));border-top:0;border-radius:0 0 18px 18px;background:color-mix(in srgb,var(--surface,#fff) 84%,#edf5ff)}
      .profile-docs-summary{width:100%;display:flex;justify-content:space-between;align-items:center;padding:13px 2px 4px;border:0;background:transparent;color:var(--text,#182230);text-align:left}
      .profile-docs-summary strong{font-size:14px}.profile-docs-summary span{font-size:12px;color:var(--muted,#7e8793)}
      .profile-docs-body{display:none;padding-top:10px}.profile-docs.open .profile-docs-body{display:block}.profile-docs.open .profile-docs-chevron{transform:rotate(180deg)}
      .profile-docs-list{display:grid;gap:8px}.profile-docs-empty{padding:14px;text-align:center;color:var(--muted,#7e8793);font-size:12px;border:1px dashed var(--line,#d9e1e8);border-radius:13px}
      .profile-doc{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:11px 12px;border-radius:13px;background:var(--surface,#fff);border:1px solid var(--line,#e5e7eb)}
      .profile-doc strong{display:block;font-size:14px}.profile-doc-date,.profile-doc-owner{font-size:12px;color:var(--muted,#7e8793);margin-top:3px}
      .profile-doc-status{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;font-size:10px;font-weight:850}.profile-doc-status.ok{background:#e7f7ef;color:#24845f}.profile-doc-status.soon{background:#fff4d8;color:#a36a00}.profile-doc-status.urgent{background:#fff0df;color:#bd5d00}.profile-doc-status.expired{background:#fff0f1;color:#c53d49}.profile-doc-status.none{background:#eef1f4;color:#687587}
      .profile-doc-actions{display:flex;gap:6px}.profile-doc-actions button{border:0;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800}.profile-doc-edit{background:var(--accent-soft,#fff0df);color:var(--accent,#d9781f)}.profile-doc-delete{background:#fff0f1;color:var(--danger,#d84a55)}
      .profile-doc-add{width:100%;margin-top:9px;border:1px dashed color-mix(in srgb,var(--accent,#d9781f) 55%,transparent);border-radius:12px;padding:10px;background:color-mix(in srgb,var(--accent-soft,#fff0df) 65%,transparent);color:var(--accent,#d9781f);font-weight:850}
      .profile-doc-form{display:none;margin-top:10px;padding:13px;border-radius:14px;background:var(--surface-2,#f5f5f5);border:1px solid var(--line,#ddd)}.profile-doc-form.open{display:block}.profile-doc-form label{display:block;margin:0 0 5px;font-size:12px;font-weight:800}.profile-doc-form input,.profile-doc-form select,.profile-doc-form textarea{width:100%;box-sizing:border-box}.profile-doc-form textarea{min-height:68px}
      .profile-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile-doc-grid .full{grid-column:1/-1}.profile-doc-owner-field{display:none!important}.profile-doc-custom[hidden]{display:none}
      .profile-doc-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:11px}.profile-doc-form-actions button{border:0;border-radius:10px;padding:9px 12px;font-weight:800}.profile-doc-cancel{background:var(--surface,#fff);color:var(--text,#182230);border:1px solid var(--line,#ddd)!important}.profile-doc-save{background:var(--accent,#d9781f);color:#fff}
      .expiry-mini{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 2px;border-radius:6px;background:var(--expiry-color,#687587);color:#fff;font-size:9px;font-weight:900}
      .expiry-day-block{margin-top:10px;padding-top:10px;border-top:1px solid var(--line,#ddd)}.expiry-day-title{font-size:12px;font-weight:850;color:var(--muted,#7e8793);margin-bottom:7px}.expiry-day-row{display:grid;grid-template-columns:4px 1fr;gap:9px;padding:9px 0}.expiry-day-bar{border-radius:99px;background:var(--expiry-color,#687587)}.expiry-day-meta{font-size:11px;color:var(--muted,#7e8793);margin-top:2px}
      @media(max-width:520px){.profile-doc{grid-template-columns:1fr}.profile-doc-grid{grid-template-columns:1fr}.profile-doc-grid .full{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function rowProfile(row){
    const name=[...row.querySelectorAll('strong,.event-title,h3,h4')].map(node=>node.textContent.trim()).find(Boolean)||'';
    return profileByName(name);
  }

  function categoryOptions(profileId,current=''){
    const values=categoryList(profileId);
    const known=values.includes(current);
    return `${values.map(value=>`<option value="${esc(value)}" ${value===current?'selected':''}>${esc(value)}</option>`).join('')}<option value="__other" ${current&&!known?'selected':''}>Otro…</option>`;
  }

  function renderProfiles(){
    const list=document.getElementById('profileList');
    if(!list)return;
    const openId=activeProfileId;
    list.querySelectorAll('.profile-docs').forEach(node=>node.remove());
    [...list.querySelectorAll('.profile-row')].forEach(row=>{
      const profile=rowProfile(row);
      if(!profile)return;
      const section=document.createElement('section');
      section.className='profile-docs';
      section.dataset.profileId=profile.stableId;
      section.dataset.profileName=profile.name;
      row.insertAdjacentElement('afterend',section);
      renderProfile(profile.stableId,section,openId===profile.stableId);
    });
  }

  function renderProfile(profileId,section,forceOpen=false){
    const profile=profileById(profileId);
    if(!profile)return;
    const own=items.filter(item=>item.profileId===profileId).sort((a,b)=>(a.expiryDate||'9999').localeCompare(b.expiryDate||'9999'));
    if(forceOpen)section.classList.add('open');
    section.innerHTML=`
      <button type="button" class="profile-docs-summary" data-doc-toggle>
        <span><strong>Documentos y vencimientos</strong><br><span>${own.length?`${own.length} guardado${own.length===1?'':'s'}`:'Documentos, seguros, revisiones…'}</span></span>
        <span class="profile-docs-chevron">⌄</span>
      </button>
      <div class="profile-docs-body">
        <div class="profile-docs-list">${own.length?own.map(item=>{
          const status=statusFor(item);
          return `<article class="profile-doc"><div><strong>${esc(item.title)}</strong><div class="profile-doc-date">${esc(formatDate(item.expiryDate))}</div><div class="profile-doc-owner">${esc(profile.name)}</div><span class="profile-doc-status ${status.key}">${esc(status.label)}</span></div><div class="profile-doc-actions"><button type="button" class="profile-doc-edit" data-doc-edit="${esc(item.id)}">Editar</button><button type="button" class="profile-doc-delete" data-doc-delete="${esc(item.id)}">Eliminar</button></div></article>`;
        }).join(''):'<div class="profile-docs-empty">Todavía no hay documentos ni vencimientos para este perfil.</div>'}</div>
        <button type="button" class="profile-doc-add" data-doc-add>＋ Añadir documento o vencimiento</button>
        <form class="profile-doc-form">
          <input type="hidden" name="profileId" value="${esc(profileId)}">
          <div class="profile-doc-grid">
            <div class="full"><label>Tipo</label><select name="category">${categoryOptions(profileId)}</select></div>
            <div class="full profile-doc-custom" hidden><label>Concepto personalizado</label><input name="customTitle" maxlength="60"></div>
            <div><label>Fecha (opcional)</label><input name="expiryDate" type="date"></div>
            <div><label>Aviso</label><select name="reminderDays"><option value="365">1 año antes</option><option value="180">6 meses antes</option><option value="90">90 días antes</option><option value="30" selected>30 días antes</option><option value="7">7 días antes</option><option value="0">El mismo día</option><option value="-1">Sin aviso</option></select></div>
            <div class="full"><label>Notas (opcional)</label><textarea name="notes" maxlength="300"></textarea></div>
          </div>
          <div class="profile-doc-form-actions"><button type="button" class="profile-doc-cancel">Cancelar</button><button type="submit" class="profile-doc-save">Guardar</button></div>
        </form>
      </div>`;
  }

  function syncCustom(form){
    const custom=form.querySelector('.profile-doc-custom');
    custom.hidden=form.elements.category.value!=='__other';
    form.elements.customTitle.required=!custom.hidden;
  }

  function closeForm(section){
    editingId='';
    const form=section?.querySelector('.profile-doc-form');
    form?.reset();
    form?.classList.remove('open');
    if(form)syncCustom(form);
  }

  function openForm(section,item=null){
    document.querySelectorAll('#profileList .profile-docs').forEach(other=>{
      if(other!==section){other.classList.remove('open');closeForm(other)}
    });
    const form=section.querySelector('.profile-doc-form');
    const profileId=section.dataset.profileId;
    activeProfileId=profileId;
    editingId=item?.id||'';
    section.classList.add('open');
    form.classList.add('open');
    form.elements.profileId.value=profileId;
    form.elements.category.innerHTML=categoryOptions(profileId,item?.title||'');
    const known=categoryList(profileId).includes(item?.title||'');
    form.elements.category.value=item?(known?item.title:'__other'):categoryList(profileId)[0];
    form.elements.customTitle.value=item&&!known?item.title:'';
    form.elements.expiryDate.value=item?.expiryDate||'';
    form.elements.reminderDays.value=String(item?.reminderDays??30);
    form.elements.notes.value=item?.notes||'';
    syncCustom(form);
    requestAnimationFrame(()=>section.previousElementSibling?.scrollIntoView({block:'start',behavior:'smooth'}));
  }

  function selectedDate(){return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day||''}
  function expiriesOn(date){return items.filter(item=>item.expiryDate===date&&item.profileId)}

  function renderCalendarMarkers(){
    const grid=document.getElementById('monthGrid');
    if(!grid)return;
    grid.querySelectorAll('.expiry-mini').forEach(node=>node.remove());
    grid.querySelectorAll('button.day[data-day]').forEach(day=>{
      const own=expiriesOn(day.dataset.day);
      if(!own.length)return;
      let markers=day.querySelector('.day-markers');
      if(!markers){markers=document.createElement('div');markers.className='day-markers';day.appendChild(markers)}
      const badge=document.createElement('span');
      badge.className='expiry-mini';
      badge.style.setProperty('--expiry-color',profileColor(own[0].profileId));
      badge.textContent=own.length>1?`📄${own.length}`:'📄';
      markers.appendChild(badge);
    });
  }

  function renderSelectedDay(){
    const panel=document.getElementById('selectedDayPanel');
    if(!panel)return;
    panel.querySelector('.expiry-day-block')?.remove();
    const own=expiriesOn(selectedDate());
    if(!own.length)return;
    const block=document.createElement('section');
    block.className='expiry-day-block';
    block.innerHTML=`<div class="expiry-day-title">Documentos y vencimientos</div>${own.map(item=>{
      const profile=profileById(item.profileId);
      const owner=profile?.name||item.profileName||'Sin asignar';
      const exactDate=formatDate(item.expiryDate);
      const status=statusFor(item).label;
      return `<div class="expiry-day-row" style="--expiry-color:${esc(profileColor(item.profileId))}"><div class="expiry-day-bar"></div><div><strong>📄 ${esc(item.title)}</strong><div class="expiry-day-meta">${esc(owner)} · ${esc(exactDate)} · ${esc(status)}</div></div></div>`;
    }).join('')}`;
    panel.appendChild(block);
  }

  function onClick(event){
    const section=event.target.closest('.profile-docs');
    if(!section)return;
    if(event.target.closest('[data-doc-toggle]')){
      const opening=!section.classList.contains('open');
      document.querySelectorAll('#profileList .profile-docs').forEach(other=>{if(other!==section){other.classList.remove('open');closeForm(other)}});
      section.classList.toggle('open',opening);
      activeProfileId=opening?section.dataset.profileId:'';
      return;
    }
    if(event.target.closest('[data-doc-add]')){openForm(section);return}
    if(event.target.closest('.profile-doc-cancel')){event.preventDefault();event.stopPropagation();closeForm(section);return}
    const edit=event.target.closest('[data-doc-edit]');
    if(edit){const item=items.find(entry=>entry.id===edit.dataset.docEdit);if(item)openForm(section,item);return}
    const remove=event.target.closest('[data-doc-delete]');
    if(remove){const item=items.find(entry=>entry.id===remove.dataset.docDelete);if(item&&confirm(`¿Eliminar “${item.title}”?`)){items=items.filter(entry=>entry.id!==item.id);persist();renderProfile(section.dataset.profileId,section,true)}}
  }

  function onChange(event){
    const form=event.target.closest('.profile-doc-form');
    if(form&&event.target.name==='category')syncCustom(form);
  }

  function onSubmit(event){
    const form=event.target.closest('.profile-doc-form');
    if(!form)return;
    event.preventDefault();
    const profileId=form.elements.profileId.value;
    const profile=profileById(profileId);
    if(!profile)return;
    const title=(form.elements.category.value==='__other'?form.elements.customTitle.value:form.elements.category.value).trim();
    if(!title)return;
    const payload={profileId,profileName:profile.name,title,expiryDate:form.elements.expiryDate.value,reminderDays:Number(form.elements.reminderDays.value),notes:form.elements.notes.value.trim(),updatedAt:Date.now()};
    if(editingId){const item=items.find(entry=>entry.id===editingId);if(item)Object.assign(item,payload)}
    else items.push({id:uid(),createdAt:Date.now(),...payload});
    persist();
    editingId='';
    activeProfileId=profileId;
    renderProfiles();
    requestAnimationFrame(()=>{
      const section=document.querySelector(`.profile-docs[data-profile-id="${CSS.escape(profileId)}"]`);
      section?.classList.add('open');
      closeForm(section);
    });
  }

  function bind(){
    const list=document.getElementById('profileList');
    if(!list||list.dataset.expiriesV3Bound==='1')return;
    list.dataset.expiriesV3Bound='1';
    list.addEventListener('click',onClick,true);
    list.addEventListener('change',onChange);
    list.addEventListener('submit',onSubmit);
  }

  function refresh(){
    bind();
    renderCalendarMarkers();
    renderSelectedDay();
  }

  function init(){
    items=load();
    ensureStyles();
    bind();
    renderProfiles();
    refresh();
    document.getElementById('openProfilesRow')?.addEventListener('click',()=>setTimeout(renderProfiles,0));
    observer=new MutationObserver(()=>requestAnimationFrame(refresh));
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('homebase:expiries-updated',refresh);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();