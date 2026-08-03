(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  const DAY_MS=86400000;
  const CATEGORIES={
    person:['DNI','Pasaporte','Permiso de conducir','Tarjeta sanitaria','Medical clase 1','Visado','Seguro médico','Revisión médica','Vacuna'],
    vehicle:['ITV','Seguro','Impuesto de circulación','Revisión','Cambio de aceite','Neumáticos','Garantía'],
    pet:['Vacuna','Desparasitación','Microchip','Seguro','Revisión veterinaria'],
    home:['Seguro del hogar','IBI','Comunidad','Certificado energético','Revisión de instalaciones','Alarma'],
    default:['Documento','Seguro','Impuesto','Revisión','Mantenimiento']
  };

  let items=load();
  let editingId='';
  let activeProfile='';
  let profileObserver=null;
  let calendarObserver=null;
  let selectedObserver=null;

  function load(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function save(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
    decorateCalendar();
    decorateSelectedDay();
  }

  function uid(){ return crypto.randomUUID?.()||`exp-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function esc(value){ return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]); }

  function profiles(){
    try{
      const saved=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
      if(Array.isArray(saved)&&saved.length)return saved;
    }catch{}
    return Array.isArray(window.PEOPLE)?window.PEOPLE:[];
  }

  function profileByName(name){ return profiles().find(profile=>profile.name===name)||{}; }
  function profileType(name){ return profileByName(name).type||'default'; }
  function profileColor(name){ return profileByName(name).color||'#3a7be0'; }
  function categoryList(name){ return CATEGORIES[profileType(name)]||CATEGORIES.default; }

  function parseLocalDate(value){
    if(!value)return null;
    const date=new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())?null:date;
  }

  function formatDate(value){
    const date=parseLocalDate(value);
    if(!date)return 'Sin fecha';
    return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date);
  }

  function daysUntil(value){
    const date=parseLocalDate(value);
    if(!date)return null;
    const today=new Date();
    today.setHours(12,0,0,0);
    return Math.round((date-today)/DAY_MS);
  }

  function statusFor(item){
    const days=daysUntil(item.expiryDate);
    if(days===null)return {key:'none',label:'Sin fecha'};
    if(days<0)return {key:'expired',label:`Caducó hace ${Math.abs(days)} día${Math.abs(days)===1?'':'s'}`};
    if(days===0)return {key:'urgent',label:'Caduca hoy'};
    if(days<=30)return {key:'urgent',label:`Caduca en ${days} día${days===1?'':'s'}`};
    if(days<=90)return {key:'soon',label:`Caduca en ${days} días`};
    return {key:'ok',label:`Caduca en ${days} días`};
  }

  function ensureStyles(){
    if(document.getElementById('hb-expiries-styles'))return;
    const style=document.createElement('style');
    style.id='hb-expiries-styles';
    style.textContent=`
      #expiryPanel{display:none!important}
      .profile-docs{margin:-2px 0 12px;padding:0 12px 12px;border:1px solid var(--line,rgba(0,0,0,.08));border-top:0;border-radius:0 0 18px 18px;background:color-mix(in srgb,var(--surface,#fff) 84%,#edf5ff)}
      .profile-docs-summary{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 2px 4px;border:0;background:transparent;color:var(--text,#182230);text-align:left}
      .profile-docs-summary strong{font-size:14px}.profile-docs-summary span{font-size:12px;color:var(--muted,#7e8793)}
      .profile-docs-chevron{font-size:18px!important;color:var(--muted,#7e8793)!important;transition:transform .18s ease}.profile-docs.open .profile-docs-chevron{transform:rotate(180deg)}
      .profile-docs-body{display:none;padding-top:10px}.profile-docs.open .profile-docs-body{display:block}
      .profile-docs-list{display:grid;gap:8px}
      .profile-docs-empty{padding:14px;text-align:center;color:var(--muted,#7e8793);font-size:12px;border:1px dashed var(--line,#d9e1e8);border-radius:13px;background:rgba(255,255,255,.34)}
      .profile-doc{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:11px 12px;border-radius:13px;background:var(--surface,#fff);border:1px solid var(--line,#e5e7eb)}
      .profile-doc strong{display:block;font-size:14px}.profile-doc-date{font-size:12px;color:var(--muted,#7e8793);margin-top:3px}.profile-doc-notes{font-size:12px;margin-top:5px;white-space:pre-wrap;color:var(--text,#182230)}
      .profile-doc-status{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;font-size:10px;font-weight:850}.profile-doc-status.ok{background:#e7f7ef;color:#24845f}.profile-doc-status.soon{background:#fff4d8;color:#a36a00}.profile-doc-status.urgent{background:#fff0df;color:#bd5d00}.profile-doc-status.expired{background:#fff0f1;color:#c53d49}.profile-doc-status.none{background:#eef1f4;color:#687587}
      .profile-doc-actions{display:flex;gap:6px}.profile-doc-actions button{border:0;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800}.profile-doc-edit{background:var(--accent-soft,#fff0df);color:var(--accent,#d9781f)}.profile-doc-delete{background:#fff0f1;color:var(--danger,#d84a55)}
      .profile-doc-add{width:100%;margin-top:9px;border:1px dashed color-mix(in srgb,var(--accent,#d9781f) 55%,transparent);border-radius:12px;padding:10px;background:color-mix(in srgb,var(--accent-soft,#fff0df) 65%,transparent);color:var(--accent,#d9781f);font-weight:850}
      .profile-doc-form{display:none;margin-top:10px;padding:13px;border-radius:14px;background:var(--surface-2,#f5f5f5);border:1px solid var(--line,#ddd)}.profile-doc-form.open{display:block}
      .profile-doc-form label{display:block;margin:0 0 5px;font-size:12px;font-weight:800}.profile-doc-form input,.profile-doc-form select,.profile-doc-form textarea{width:100%;box-sizing:border-box}.profile-doc-form textarea{min-height:68px;resize:vertical}
      .profile-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile-doc-grid .full{grid-column:1/-1}.profile-doc-custom[hidden]{display:none}
      .profile-doc-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:11px}.profile-doc-form-actions button{border:0;border-radius:10px;padding:9px 12px;font-weight:800}.profile-doc-cancel{background:var(--surface,#fff);color:var(--text,#182230);border:1px solid var(--line,#ddd)!important}.profile-doc-save{background:var(--accent,#d9781f);color:#fff}
      .expiry-mini{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 2px;border-radius:6px;background:var(--expiry-color,#687587);color:#fff;font-size:9px;font-weight:900;box-shadow:0 1px 3px rgba(0,0,0,.16)}
      .expiry-day-block{margin-top:10px;padding-top:10px;border-top:1px solid var(--line,#ddd)}.expiry-day-title{font-size:12px;font-weight:850;color:var(--muted,#7e8793);margin-bottom:7px}.expiry-day-row{display:grid;grid-template-columns:4px 1fr;gap:9px;padding:9px 0}.expiry-day-bar{border-radius:99px;background:var(--expiry-color,#687587)}.expiry-day-row strong{font-size:13px}.expiry-day-meta{font-size:11px;color:var(--muted,#7e8793);margin-top:2px}
      @media(max-width:520px){.profile-doc{grid-template-columns:1fr}.profile-doc-actions{justify-content:flex-end}.profile-doc-grid{grid-template-columns:1fr}.profile-doc-grid .full{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function profileRows(){ return [...document.querySelectorAll('#profileList .profile-row')]; }
  function removeOldGlobalPanel(){ document.getElementById('expiryPanel')?.remove(); }

  function decorateProfiles(){
    const list=document.getElementById('profileList');
    if(!list)return;
    removeOldGlobalPanel();
    ensureStyles();

    const data=profiles();
    profileRows().forEach((row,index)=>{
      let name=data[index]?.name||'';
      if(!name){
        const candidates=[...row.querySelectorAll('strong,.event-title,h3,h4')].map(node=>node.textContent.trim()).filter(Boolean);
        name=candidates[0]||'';
      }
      if(!name)return;

      const next=row.nextElementSibling;
      if(next?.classList.contains('profile-docs')){
        next.dataset.profile=name;
        renderProfile(name,next);
        return;
      }

      const section=document.createElement('section');
      section.className='profile-docs';
      section.dataset.profile=name;
      row.insertAdjacentElement('afterend',section);
      renderProfile(name,section);
    });
  }

  function categoryOptions(name,current=''){
    const options=categoryList(name);
    const known=options.includes(current);
    return `${options.map(value=>`<option value="${esc(value)}" ${value===current?'selected':''}>${esc(value)}</option>`).join('')}<option value="__other" ${current&&!known?'selected':''}>Otro…</option>`;
  }

  function renderProfile(name,section){
    const own=items.filter(item=>item.profileName===name).sort((a,b)=>{
      if(a.expiryDate&&b.expiryDate)return a.expiryDate.localeCompare(b.expiryDate);
      if(a.expiryDate)return -1;if(b.expiryDate)return 1;
      return a.title.localeCompare(b.title,'es');
    });
    const count=own.length;
    const isOpen=section.classList.contains('open')||activeProfile===name;
    section.classList.toggle('open',isOpen);
    section.innerHTML=`
      <button type="button" class="profile-docs-summary" data-doc-toggle="${esc(name)}">
        <span><strong>Documentos y vencimientos</strong><br><span>${count?`${count} guardado${count===1?'':'s'}`:'Documentos, seguros, revisiones…'}</span></span>
        <span class="profile-docs-chevron">⌄</span>
      </button>
      <div class="profile-docs-body">
        <div class="profile-docs-list">
          ${own.length?own.map(item=>{
            const status=statusFor(item);
            return `<article class="profile-doc">
              <div><strong>${esc(item.title)}</strong><div class="profile-doc-date">${esc(formatDate(item.expiryDate))}</div><span class="profile-doc-status ${status.key}">${esc(status.label)}</span>${item.notes?`<div class="profile-doc-notes">${esc(item.notes)}</div>`:''}</div>
              <div class="profile-doc-actions"><button type="button" class="profile-doc-edit" data-doc-edit="${esc(item.id)}">Editar</button><button type="button" class="profile-doc-delete" data-doc-delete="${esc(item.id)}">Eliminar</button></div>
            </article>`;
          }).join(''):'<div class="profile-docs-empty">Todavía no hay documentos ni vencimientos para este perfil.</div>'}
        </div>
        <button type="button" class="profile-doc-add" data-doc-add="${esc(name)}">＋ Añadir documento o vencimiento</button>
        <form class="profile-doc-form" data-doc-form="${esc(name)}">
          <div class="profile-doc-grid">
            <div class="full"><label>Tipo</label><select name="category">${categoryOptions(name)}</select></div>
            <div class="full profile-doc-custom" hidden><label>Concepto personalizado</label><input name="customTitle" maxlength="60" placeholder="Escribe el nombre"></div>
            <div><label>Fecha (opcional)</label><input name="expiryDate" type="date"></div>
            <div><label>Aviso</label><select name="reminderDays"><option value="90">90 días antes</option><option value="30" selected>30 días antes</option><option value="7">7 días antes</option><option value="0">El mismo día</option><option value="-1">Sin aviso</option></select></div>
            <div class="full"><label>Notas (opcional)</label><textarea name="notes" maxlength="300" placeholder="Número, lugar de renovación, observaciones…"></textarea></div>
          </div>
          <div class="profile-doc-form-actions"><button type="button" class="profile-doc-cancel">Cancelar</button><button type="submit" class="profile-doc-save">Guardar</button></div>
        </form>
      </div>`;
  }

  function syncCustomField(form){
    const custom=form.querySelector('.profile-doc-custom');
    if(!custom)return;
    custom.hidden=form.elements.category.value!=='__other';
    form.elements.customTitle.required=!custom.hidden;
  }

  function openForm(section,item=null){
    const name=section.dataset.profile;
    activeProfile=name;
    editingId=item?.id||'';
    section.classList.add('open');
    const form=section.querySelector('.profile-doc-form');
    form.classList.add('open');
    const known=categoryList(name).includes(item?.title||'');
    form.elements.category.value=item?(known?item.title:'__other'):categoryList(name)[0];
    form.elements.customTitle.value=item&&!known?item.title:'';
    form.elements.expiryDate.value=item?.expiryDate||'';
    form.elements.reminderDays.value=String(item?.reminderDays??30);
    form.elements.notes.value=item?.notes||'';
    syncCustomField(form);
    requestAnimationFrame(()=>form.elements.category.focus());
  }

  function closeForm(section){
    editingId='';
    const form=section.querySelector('.profile-doc-form');
    form?.reset();
    form?.classList.remove('open');
  }

  function onProfilesChange(event){
    const form=event.target.closest('.profile-doc-form');
    if(form&&event.target.name==='category')syncCustomField(form);
  }

  function onProfilesClick(event){
    const section=event.target.closest('.profile-docs');
    if(!section)return;
    const name=section.dataset.profile;

    if(event.target.closest('[data-doc-toggle]')){
      const opening=!section.classList.contains('open');
      activeProfile=opening?name:'';
      section.classList.toggle('open',opening);
      return;
    }
    if(event.target.closest('[data-doc-add]')){ openForm(section); return; }
    if(event.target.closest('.profile-doc-cancel')){ closeForm(section); return; }

    const edit=event.target.closest('[data-doc-edit]');
    if(edit){
      const item=items.find(entry=>entry.id===edit.dataset.docEdit);
      if(item)openForm(section,item);
      return;
    }

    const remove=event.target.closest('[data-doc-delete]');
    if(remove){
      const item=items.find(entry=>entry.id===remove.dataset.docDelete);
      if(!item)return;
      if(!confirm(`¿Eliminar “${item.title}” de ${item.profileName}?`))return;
      items=items.filter(entry=>entry.id!==item.id);
      save();
      renderProfile(name,section);
    }
  }

  function onProfilesSubmit(event){
    const form=event.target.closest('.profile-doc-form');
    if(!form)return;
    event.preventDefault();
    const section=form.closest('.profile-docs');
    const profileName=section.dataset.profile;
    const title=(form.elements.category.value==='__other'?form.elements.customTitle.value:form.elements.category.value).trim();
    const expiryDate=form.elements.expiryDate.value;
    const reminderDays=Number(form.elements.reminderDays.value);
    const notes=form.elements.notes.value.trim();
    if(!profileName||!title)return;

    const now=Date.now();
    if(editingId){
      const item=items.find(entry=>entry.id===editingId);
      if(item)Object.assign(item,{profileName,title,expiryDate,reminderDays,notes,updatedAt:now});
    }else{
      items.push({id:uid(),profileName,title,expiryDate,reminderDays,notes,createdAt:now,updatedAt:now});
    }
    save();
    editingId='';
    activeProfile=profileName;
    renderProfile(profileName,section);
  }

  function expiriesOn(dateIso){ return items.filter(item=>item.expiryDate===dateIso); }

  function decorateCalendar(){
    const grid=document.getElementById('monthGrid');
    if(!grid)return;
    grid.querySelectorAll('.expiry-mini').forEach(node=>node.remove());
    grid.querySelectorAll('button.day[data-day]').forEach(day=>{
      const own=expiriesOn(day.dataset.day);
      if(!own.length)return;
      let markers=day.querySelector('.day-markers');
      if(!markers){
        markers=document.createElement('div');
        markers.className='day-markers';
        day.appendChild(markers);
      }
      const marker=document.createElement('span');
      marker.className='expiry-mini';
      marker.style.setProperty('--expiry-color',profileColor(own[0].profileName));
      marker.title=own.map(item=>`${item.title} · ${item.profileName}`).join('\n');
      marker.textContent=own.length>1?`📄${own.length}`:'📄';
      markers.appendChild(marker);
    });
  }

  function selectedDateIso(){
    return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day||'';
  }

  function decorateSelectedDay(){
    const panel=document.getElementById('selectedDayPanel');
    if(!panel)return;
    panel.querySelector('.expiry-day-block')?.remove();
    const dateIso=selectedDateIso();
    if(!dateIso)return;
    const own=expiriesOn(dateIso);
    if(!own.length)return;
    const block=document.createElement('section');
    block.className='expiry-day-block';
    block.innerHTML=`<div class="expiry-day-title">Documentos y vencimientos</div>${own.map(item=>`
      <div class="expiry-day-row" style="--expiry-color:${esc(profileColor(item.profileName))}">
        <div class="expiry-day-bar"></div><div><strong>📄 ${esc(item.title)}</strong><div class="expiry-day-meta">${esc(item.profileName)} · ${esc(statusFor(item).label)}</div></div>
      </div>`).join('')}`;
    panel.appendChild(block);
  }

  function watchProfileList(){
    const list=document.getElementById('profileList');
    if(!list||profileObserver)return;
    profileObserver=new MutationObserver(mutations=>{
      if(mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(node=>node.nodeType===1&&!node.classList?.contains('profile-docs'))))requestAnimationFrame(decorateProfiles);
    });
    profileObserver.observe(list,{childList:true});
  }

  function watchCalendar(){
    const grid=document.getElementById('monthGrid');
    if(grid&&!calendarObserver){
      calendarObserver=new MutationObserver(()=>requestAnimationFrame(()=>{decorateCalendar();decorateSelectedDay()}));
      calendarObserver.observe(grid,{childList:true});
    }
    const panel=document.getElementById('selectedDayPanel');
    if(panel&&!selectedObserver){
      selectedObserver=new MutationObserver(()=>requestAnimationFrame(decorateSelectedDay));
      selectedObserver.observe(panel,{childList:true});
    }
  }

  function init(){
    ensureStyles();
    const list=document.getElementById('profileList');
    if(list){
      list.addEventListener('click',onProfilesClick);
      list.addEventListener('change',onProfilesChange);
      list.addEventListener('submit',onProfilesSubmit);
      watchProfileList();
    }
    document.getElementById('openProfilesRow')?.addEventListener('click',()=>setTimeout(decorateProfiles,0));
    document.getElementById('addProfileButton')?.addEventListener('click',()=>requestAnimationFrame(decorateProfiles));
    document.getElementById('calendarPage')?.addEventListener('click',()=>requestAnimationFrame(()=>{decorateCalendar();decorateSelectedDay()}));
    decorateProfiles();
    decorateCalendar();
    decorateSelectedDay();
    watchCalendar();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
