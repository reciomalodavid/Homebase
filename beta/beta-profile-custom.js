(()=>{
  const KEY='homebase_beta_custom_profile_types';
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
  const save=m=>localStorage.setItem(KEY,JSON.stringify(m));
  let custom=load();

  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function setupForm(){
    const form=document.getElementById('profileForm');
    const type=document.getElementById('profileType');
    const name=document.getElementById('profileName');
    const editing=document.getElementById('profileEditingName');
    if(!form||!type||!name||!editing||form.dataset.customTypeReady)return;
    form.dataset.customTypeReady='1';

    if(!type.querySelector('option[value="custom"]')){
      const option=document.createElement('option');
      option.value='custom';
      option.textContent='Otro…';
      type.appendChild(option);
    }

    const wrap=document.createElement('div');
    wrap.id='profileCustomTypeWrap';
    wrap.hidden=true;
    wrap.innerHTML='<label for="profileCustomType">Tipo personalizado</label><input id="profileCustomType" maxlength="30" placeholder="Ej. Barco, Asociación, Negocio…">';
    type.insertAdjacentElement('afterend',wrap);
    const input=wrap.querySelector('input');

    const refresh=()=>{
      const show=type.value==='custom';
      wrap.hidden=!show;
      input.required=show;
      if(show&&!input.value)requestAnimationFrame(()=>input.focus());
    };
    type.addEventListener('change',refresh);

    const addButton=document.getElementById('addProfileButton');
    addButton?.addEventListener('click',()=>{input.value='';refresh()});

    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-edit-profile]');
      if(!btn)return;
      const old=btn.dataset.editProfile;
      const label=custom[old];
      requestAnimationFrame(()=>{
        if(label){type.value='custom';input.value=label}else{input.value=''}
        refresh();
      });
    },true);

    form.addEventListener('submit',()=>{
      const oldName=editing.value.trim();
      const newName=name.value.trim();
      const isCustom=type.value==='custom';
      const label=input.value.trim();
      if(isCustom&&!label)return;
      if(isCustom)type.value='person';
      setTimeout(()=>{
        custom=load();
        if(oldName&&oldName!==newName&&custom[oldName])delete custom[oldName];
        if(isCustom&&newName)custom[newName]=label;
        else if(newName)delete custom[newName];
        save(custom);
        decorate();
        input.value='';
        refresh();
      },0);
    },true);

    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-delete-profile]');
      if(!btn)return;
      const profileName=btn.dataset.deleteProfile;
      setTimeout(()=>{custom=load();if(custom[profileName]){delete custom[profileName];save(custom)}},0);
    },true);
  }

  function decorate(){
    custom=load();
    document.querySelectorAll('.profile-row').forEach(row=>{
      const strong=row.querySelector('.profile-row-main strong');
      const kind=row.querySelector('.profile-kind');
      if(!strong||!kind)return;
      const label=custom[strong.textContent.trim()];
      if(label)kind.innerHTML=`🏷️ ${esc(label)} · ${/Foto personalizada/.test(kind.textContent)?'Foto personalizada':'Iniciales y color'}`;
    });
  }

  function run(){setupForm();decorate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
})();
