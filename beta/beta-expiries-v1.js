(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  let items=load();
  let editingId='';
  let activeProfile='';
  let observer=null;

  function load(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(items)); }
  function uid(){ return crypto.randomUUID?.()||`exp-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function esc(value){ return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]); }

  function profiles(){
    try{
      const saved=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
      if(Array.isArray(saved)&&saved.length)return saved;
    }catch{}
    return Array.isArray(window.PEOPLE)?window.PEOPLE:[];
  }

  function formatDate(value){
    if(!value)return 'Sin fecha';
    const date=new Date(`${value}T12:00:00`);
    if(Number.isNaN(date.getTime()))return value;
    return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(date);
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
      .profile-doc-actions{display:flex;gap:6px}.profile-doc-actions button{border:0;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800}.profile-doc-edit{background:var(--accent-soft,#fff0df);color:var(--accent,#d9781f)}.profile-doc-delete{background:#fff0f1;color:var(--danger,#d84a55)}
      .profile-doc-add{width:100%;margin-top:9px;border:1px dashed color-mix(in srgb,var(--accent,#d9781f) 55%,transparent);border-radius:12px;padding:10px;background:color-mix(in srgb,var(--accent-soft,#fff0df) 65%,transparent);color:var(--accent,#d9781f);font-weight:850}
      .profile-doc-form{display:none;margin-top:10px;padding:13px;border-radius:14px;background:var(--surface-2,#f5f5f5);border:1px solid var(--line,#ddd)}.profile-doc-form.open{display:block}
      .profile-doc-form label{display:block;margin:0 0 5px;font-size:12px;font-weight:800}.profile-doc-form input,.profile-doc-form textarea{width:100%;box-sizing:border-box}.profile-doc-form textarea{min-height:68px;resize:vertical}
      .profile-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile-doc-grid .full{grid-column:1/-1}
      .profile-doc-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:11px}.profile-doc-form-actions button{border:0;border-radius:10px;padding:9px 12px;font-weight:800}.profile-doc-cancel{background:var(--surface,#fff);color:var(--text,#182230);border:1px solid var(--line,#ddd)!important}.profile-doc-save{background:var(--accent,#d9781f);color:#fff}
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
        <span><strong>Documentos y vencimientos</strong><br><span>${count?`${count} guardado${count===1?'':'s'}`:'DNI, pasaporte, seguros, ITV…'}</span></span>
        <span class="profile-docs-chevron">⌄</span>
      </button>
      <div class="profile-docs-body">
        <div class="profile-docs-list">
          ${own.length?own.map(item=>`
            <article class="profile-doc">
              <div><strong>${esc(item.title)}</strong><div class="profile-doc-date">${esc(formatDate(item.expiryDate))}</div>${item.notes?`<div class="profile-doc-notes">${esc(item.notes)}</div>`:''}</div>
              <div class="profile-doc-actions"><button type="button" class="profile-doc-edit" data-doc-edit="${esc(item.id)}">Editar</button><button type="button" class="profile-doc-delete" data-doc-delete="${esc(item.id)}">Eliminar</button></div>
            </article>`).join(''):'<div class="profile-docs-empty">Todavía no hay documentos ni vencimientos para este perfil.</div>'}
        </div>
        <button type="button" class="profile-doc-add" data-doc-add="${esc(name)}">＋ Añadir documento o vencimiento</button>
        <form class="profile-doc-form" data-doc-form="${esc(name)}">
          <div class="profile-doc-grid">
            <div class="full"><label>Concepto</label><input name="title" maxlength="60" required placeholder="Ej. DNI, Medical clase 1, ITV…"></div>
            <div><label>Fecha (opcional)</label><input name="expiryDate" type="date"></div>
            <div class="full"><label>Notas (opcional)</label><textarea name="notes" maxlength="300" placeholder="Número, lugar de renovación, observaciones…"></textarea></div>
          </div>
          <div class="profile-doc-form-actions"><button type="button" class="profile-doc-cancel">Cancelar</button><button type="submit" class="profile-doc-save">Guardar</button></div>
        </form>
      </div>`;
  }

  function openForm(section,item=null){
    const name=section.dataset.profile;
    activeProfile=name;
    editingId=item?.id||'';
    section.classList.add('open');
    const form=section.querySelector('.profile-doc-form');
    form.classList.add('open');
    form.elements.title.value=item?.title||'';
    form.elements.expiryDate.value=item?.expiryDate||'';
    form.elements.notes.value=item?.notes||'';
    requestAnimationFrame(()=>form.elements.title.focus());
  }

  function closeForm(section){
    editingId='';
    const form=section.querySelector('.profile-doc-form');
    form?.reset();
    form?.classList.remove('open');
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
    const title=form.elements.title.value.trim();
    const expiryDate=form.elements.expiryDate.value;
    const notes=form.elements.notes.value.trim();
    if(!profileName||!title)return;

    const now=Date.now();
    if(editingId){
      const item=items.find(entry=>entry.id===editingId);
      if(item)Object.assign(item,{profileName,title,expiryDate,notes,updatedAt:now});
    }else{
      items.push({id:uid(),profileName,title,expiryDate,notes,createdAt:now,updatedAt:now});
    }
    save();
    editingId='';
    activeProfile=profileName;
    renderProfile(profileName,section);
  }

  function watchProfileList(){
    const list=document.getElementById('profileList');
    if(!list||observer)return;
    observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(node=>node.nodeType===1&&!node.classList?.contains('profile-docs')))){
        requestAnimationFrame(decorateProfiles);
      }
    });
    observer.observe(list,{childList:true});
  }

  function init(){
    ensureStyles();
    const list=document.getElementById('profileList');
    if(list){
      list.addEventListener('click',onProfilesClick);
      list.addEventListener('submit',onProfilesSubmit);
      watchProfileList();
    }
    document.getElementById('openProfilesRow')?.addEventListener('click',()=>setTimeout(decorateProfiles,0));
    document.getElementById('addProfileButton')?.addEventListener('click',()=>requestAnimationFrame(decorateProfiles));
    decorateProfiles();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
