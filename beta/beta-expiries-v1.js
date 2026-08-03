(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  let items=load();
  let editingId='';

  function load(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function save(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
  }

  function uid(){
    return (crypto.randomUUID?.()||`exp-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  function esc(value){
    return String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    })[char]);
  }

  function profiles(){
    try{
      const saved=JSON.parse(localStorage.getItem('homebase_profiles')||'[]');
      if(Array.isArray(saved)&&saved.length)return saved;
    }catch{}
    return Array.isArray(window.PEOPLE)?window.PEOPLE:[];
  }

  function profileName(item){
    return item.profileName||'Sin perfil';
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
      .expiry-panel{margin-top:18px;padding:16px;border-radius:20px;background:var(--surface,rgba(255,255,255,.82));border:1px solid var(--line,rgba(0,0,0,.08));box-shadow:var(--shadow,0 10px 30px rgba(0,0,0,.08))}
      .expiry-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.expiry-head h3{margin:0;font-size:18px}.expiry-head p{margin:3px 0 0;color:var(--muted,#7e8793);font-size:12px}
      .expiry-add{border:0;border-radius:12px;padding:10px 12px;background:var(--accent,#d9781f);color:#fff;font-weight:850;white-space:nowrap}
      .expiry-form{display:none;margin:12px 0;padding:14px;border-radius:16px;background:var(--surface-2,#f5f5f5);border:1px solid var(--line,#ddd)}.expiry-form.open{display:block}
      .expiry-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.expiry-grid .full{grid-column:1/-1}.expiry-form label{margin:0 0 5px;display:block;font-size:12px;font-weight:800}.expiry-form input,.expiry-form select,.expiry-form textarea{width:100%;box-sizing:border-box}.expiry-form textarea{min-height:72px;resize:vertical}
      .expiry-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.expiry-actions button{border:0;border-radius:11px;padding:10px 13px;font-weight:800}.expiry-cancel{background:var(--surface,#fff);color:var(--text,#182230);border:1px solid var(--line,#ddd)!important}.expiry-save{background:var(--accent,#d9781f);color:#fff}
      .expiry-list{display:grid;gap:9px}.expiry-empty{padding:18px;text-align:center;color:var(--muted,#7e8793);border:1px dashed var(--line,#ddd);border-radius:14px}
      .expiry-item{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px;border-radius:14px;background:var(--surface-2,#f5f5f5);border:1px solid var(--line,#ddd)}.expiry-item strong{display:block}.expiry-meta{font-size:12px;color:var(--muted,#7e8793);margin-top:3px}.expiry-notes{font-size:12px;margin-top:6px;white-space:pre-wrap}.expiry-item-actions{display:flex;gap:6px}.expiry-item-actions button{border:0;border-radius:9px;padding:8px 9px;font-size:11px;font-weight:800}.expiry-edit{background:var(--accent-soft,#fff0df);color:var(--accent,#d9781f)}.expiry-delete{background:#fff0f1;color:var(--danger,#d84a55)}
      @media(max-width:520px){.expiry-grid{grid-template-columns:1fr}.expiry-grid .full{grid-column:auto}.expiry-head{align-items:center}.expiry-item{grid-template-columns:1fr}.expiry-item-actions{justify-content:flex-end}}
    `;
    document.head.appendChild(style);
  }

  function mount(){
    if(document.getElementById('expiryPanel'))return;
    const profileForm=document.getElementById('profileForm');
    const profileList=document.getElementById('profileList');
    const anchor=profileForm||profileList;
    if(!anchor)return;

    ensureStyles();
    const panel=document.createElement('section');
    panel.id='expiryPanel';
    panel.className='expiry-panel';
    panel.innerHTML=`
      <div class="expiry-head">
        <div><h3>Caducidades</h3><p>DNI, pasaporte, Medical, ITV, seguros o cualquier otro concepto.</p></div>
        <button type="button" class="expiry-add" id="expiryAdd">＋ Añadir</button>
      </div>
      <form class="expiry-form" id="expiryForm">
        <div class="expiry-grid">
          <div><label for="expiryProfile">Perfil</label><select id="expiryProfile" required></select></div>
          <div><label for="expiryDate">Fecha (opcional)</label><input id="expiryDate" type="date"></div>
          <div class="full"><label for="expiryTitle">Concepto</label><input id="expiryTitle" maxlength="60" required placeholder="Ej. DNI, Medical clase 1, ITV…"></div>
          <div class="full"><label for="expiryNotes">Notas (opcional)</label><textarea id="expiryNotes" maxlength="300" placeholder="Número, lugar de renovación, observaciones…"></textarea></div>
        </div>
        <div class="expiry-actions"><button type="button" class="expiry-cancel" id="expiryCancel">Cancelar</button><button type="submit" class="expiry-save">Guardar</button></div>
      </form>
      <div class="expiry-list" id="expiryList"></div>
    `;
    anchor.insertAdjacentElement('afterend',panel);

    document.getElementById('expiryAdd').addEventListener('click',()=>openForm());
    document.getElementById('expiryCancel').addEventListener('click',closeForm);
    document.getElementById('expiryForm').addEventListener('submit',submit);
    document.getElementById('expiryList').addEventListener('click',onListClick);
    render();
  }

  function fillProfiles(selected=''){
    const select=document.getElementById('expiryProfile');
    if(!select)return;
    const list=profiles();
    select.innerHTML=list.map(profile=>`<option value="${esc(profile.name)}">${esc(profile.name)}</option>`).join('');
    if(selected&&list.some(profile=>profile.name===selected))select.value=selected;
  }

  function openForm(item=null){
    editingId=item?.id||'';
    fillProfiles(item?.profileName||'');
    document.getElementById('expiryTitle').value=item?.title||'';
    document.getElementById('expiryDate').value=item?.expiryDate||'';
    document.getElementById('expiryNotes').value=item?.notes||'';
    document.getElementById('expiryForm').classList.add('open');
    requestAnimationFrame(()=>document.getElementById('expiryTitle').focus());
  }

  function closeForm(){
    editingId='';
    const form=document.getElementById('expiryForm');
    form?.reset();
    form?.classList.remove('open');
  }

  function submit(event){
    event.preventDefault();
    const profileName=document.getElementById('expiryProfile').value.trim();
    const title=document.getElementById('expiryTitle').value.trim();
    const expiryDate=document.getElementById('expiryDate').value;
    const notes=document.getElementById('expiryNotes').value.trim();
    if(!profileName||!title)return;

    const now=Date.now();
    if(editingId){
      const item=items.find(entry=>entry.id===editingId);
      if(item)Object.assign(item,{profileName,title,expiryDate,notes,updatedAt:now});
    }else{
      items.push({id:uid(),profileName,title,expiryDate,notes,createdAt:now,updatedAt:now});
    }
    save();
    closeForm();
    render();
  }

  function onListClick(event){
    const edit=event.target.closest('[data-expiry-edit]');
    if(edit){
      const item=items.find(entry=>entry.id===edit.dataset.expiryEdit);
      if(item)openForm(item);
      return;
    }
    const remove=event.target.closest('[data-expiry-delete]');
    if(remove){
      const item=items.find(entry=>entry.id===remove.dataset.expiryDelete);
      if(!item)return;
      if(!confirm(`¿Eliminar “${item.title}” de ${profileName(item)}?`))return;
      items=items.filter(entry=>entry.id!==item.id);
      save();
      render();
    }
  }

  function render(){
    const list=document.getElementById('expiryList');
    if(!list)return;
    if(!items.length){
      list.innerHTML='<div class="expiry-empty">Todavía no hay ninguna caducidad guardada.</div>';
      return;
    }
    const sorted=[...items].sort((a,b)=>{
      if(a.expiryDate&&b.expiryDate)return a.expiryDate.localeCompare(b.expiryDate);
      if(a.expiryDate)return -1;if(b.expiryDate)return 1;
      return profileName(a).localeCompare(profileName(b),'es');
    });
    list.innerHTML=sorted.map(item=>`
      <article class="expiry-item">
        <div><strong>${esc(item.title)}</strong><div class="expiry-meta">${esc(profileName(item))} · ${esc(formatDate(item.expiryDate))}</div>${item.notes?`<div class="expiry-notes">${esc(item.notes)}</div>`:''}</div>
        <div class="expiry-item-actions"><button type="button" class="expiry-edit" data-expiry-edit="${esc(item.id)}">Editar</button><button type="button" class="expiry-delete" data-expiry-delete="${esc(item.id)}">Eliminar</button></div>
      </article>
    `).join('');
  }

  function init(){
    mount();
    document.querySelectorAll('.nav-btn').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.page==='morePage')requestAnimationFrame(()=>{mount();render()});
    }));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
