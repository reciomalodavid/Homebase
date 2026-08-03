(()=>{
  'use strict';

  function ensureStyles(){
    if(document.getElementById('hb-beta-profile-enhancements-style'))return;
    const style=document.createElement('style');
    style.id='hb-beta-profile-enhancements-style';
    style.textContent=`
      .profile-doc-reminder-custom{display:none;margin-top:8px}.profile-doc-reminder-custom.open{display:block}
      .profile-photo-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(9,15,24,.72);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
      .profile-photo-overlay.open{display:flex}
      .profile-photo-card{width:min(100%,420px);padding:18px;border-radius:26px;background:rgba(255,255,255,.94);box-shadow:0 28px 80px rgba(0,0,0,.32);text-align:center;color:#182230}
      .profile-photo-card img{display:block;width:min(72vw,320px);height:min(72vw,320px);max-width:320px;max-height:320px;margin:0 auto;border-radius:24px;object-fit:cover;background:#eef1f4}
      .profile-photo-card h3{margin:14px 0 4px;font-size:20px}.profile-photo-card p{margin:0 0 16px;color:#687587;font-size:13px}
      .profile-photo-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.profile-photo-actions button{border:0;border-radius:13px;padding:12px;font-weight:850}
      .profile-photo-change{background:#fff0df;color:#b85d00}.profile-photo-remove{background:#fff0f1;color:#c53d49}.profile-photo-close{grid-column:1/-1;background:#eef1f4;color:#182230}
      #profileList .profile-row .avatar{cursor:zoom-in}
    `;
    document.head.appendChild(style);
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
      wrap.classList.remove('open');
      return true;
    };

    select.addEventListener('change',()=>{
      const custom=select.value==='__custom';
      wrap.classList.toggle('open',custom);
      if(custom)requestAnimationFrame(()=>input.focus());
    });
    input.addEventListener('change',applyCustom);
    input.addEventListener('blur',()=>{ if(select.value==='__custom')applyCustom(); });
    form.addEventListener('submit',event=>{
      if(select.value==='__custom'&&!applyCustom()){
        event.preventDefault();
        input.focus();
      }
    },true);
  }

  function enhanceAllReminderForms(root=document){
    root.querySelectorAll?.('.profile-doc-form').forEach(enhanceReminderForm);
  }

  function ensurePhotoOverlay(){
    let overlay=document.getElementById('profilePhotoOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='profilePhotoOverlay';
    overlay.className='profile-photo-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.innerHTML=`<div class="profile-photo-card"><img alt="Foto de perfil"><h3></h3><p>Foto del perfil</p><div class="profile-photo-actions"><button type="button" class="profile-photo-change">Cambiar foto</button><button type="button" class="profile-photo-remove">Eliminar foto</button><button type="button" class="profile-photo-close">Cerrar</button></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',event=>{
      if(event.target===overlay||event.target.closest('.profile-photo-close'))closePhotoOverlay();
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closePhotoOverlay()});
    return overlay;
  }

  function closePhotoOverlay(){
    const overlay=document.getElementById('profilePhotoOverlay');
    overlay?.classList.remove('open');
    if(overlay)delete overlay.dataset.profileIndex;
  }

  function profileNameFromRow(row){
    return row?.querySelector('strong,.event-title,h3,h4')?.textContent?.trim()||'Perfil';
  }

  function openPhotoOverlay(row){
    const avatar=row?.querySelector('.avatar');
    const image=avatar?.querySelector('img');
    const upload=row?.querySelector('.profile-upload,input[type="file"]');
    if(!image){
      if(upload?.matches('input[type="file"]'))upload.click();
      else upload?.click();
      return;
    }

    const overlay=ensurePhotoOverlay();
    const rows=[...document.querySelectorAll('#profileList .profile-row')];
    overlay.dataset.profileIndex=String(rows.indexOf(row));
    overlay.querySelector('img').src=image.currentSrc||image.src;
    overlay.querySelector('h3').textContent=profileNameFromRow(row);
    overlay.querySelector('.profile-photo-remove').hidden=!row.querySelector('.profile-remove');
    overlay.classList.add('open');
  }

  function currentPhotoRow(){
    const overlay=document.getElementById('profilePhotoOverlay');
    const index=Number(overlay?.dataset.profileIndex);
    return Number.isInteger(index)?document.querySelectorAll('#profileList .profile-row')[index]:null;
  }

  document.addEventListener('click',event=>{
    const avatar=event.target.closest('#profileList .profile-row .avatar');
    if(avatar){
      event.preventDefault();
      event.stopPropagation();
      openPhotoOverlay(avatar.closest('.profile-row'));
      return;
    }
    if(event.target.closest('.profile-photo-change')){
      const row=currentPhotoRow();
      closePhotoOverlay();
      const control=row?.querySelector('.profile-upload,input[type="file"]');
      if(control?.matches('input[type="file"]'))control.click(); else control?.click();
      return;
    }
    if(event.target.closest('.profile-photo-remove')){
      const row=currentPhotoRow();
      closePhotoOverlay();
      row?.querySelector('.profile-remove')?.click();
    }
  },true);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===1)enhanceAllReminderForms(node);
      }
    }
  });

  function init(){
    ensureStyles();
    ensurePhotoOverlay();
    enhanceAllReminderForms();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();