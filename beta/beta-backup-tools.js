(()=>{
  'use strict';

  function snapshot(){
    const storage={};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key!==null)storage[key]=localStorage.getItem(key);
    }
    return {
      format:'homebase-beta-local-backup',
      version:1,
      createdAt:new Date().toISOString(),
      origin:location.origin,
      userAgent:navigator.userAgent,
      localStorage:storage
    };
  }

  function fileName(){
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    return `homebase-beta-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  }

  function downloadBackup(event){
    event?.preventDefault();
    event?.stopPropagation();
    try{
      const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;
      link.download=fileName();
      link.hidden=true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){
      console.error('Homebase Beta backup',error);
      alert('No se pudo generar la copia de seguridad en este dispositivo.');
    }
  }

  function addBackupCard(){
    if(document.getElementById('homebaseBetaBackupCard'))return;
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(page=>/Sincronización familiar/i.test(page.textContent||''))||pages.at(-1);
    if(!target)return;

    const card=document.createElement('section');
    card.id='homebaseBetaBackupCard';
    card.className='section card';
    card.style.cssText='padding:0;overflow:hidden';
    card.innerHTML=`
      <button type="button" id="homebaseBetaBackupToggle" aria-expanded="false" style="width:100%;min-height:72px;padding:14px 16px;border:0;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:space-between;text-align:left">
        <span><strong style="display:block;font-size:17px">Copia de seguridad</strong><span style="display:block;margin-top:3px;color:var(--muted);font-size:12px">Datos de esta Beta</span></span>
        <span aria-hidden="true" style="font-size:20px;color:var(--muted);transition:transform .2s">⌄</span>
      </button>
      <div id="homebaseBetaBackupBody" hidden style="padding:0 16px 16px">
        <p style="margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45">Descarga una copia de los datos locales aislados de Homebase Beta sin modificar ni borrar nada.</p>
        <button type="button" id="homebaseBetaBackupButton" style="width:100%;border:0;border-radius:13px;padding:13px;background:var(--accent);color:#fff;font-weight:850">Descargar copia de seguridad</button>
      </div>`;
    target.appendChild(card);

    const toggle=card.querySelector('#homebaseBetaBackupToggle');
    const body=card.querySelector('#homebaseBetaBackupBody');
    const chevron=toggle.lastElementChild;
    toggle.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const opening=body.hidden;
      body.hidden=!opening;
      toggle.setAttribute('aria-expanded',String(opening));
      chevron.style.transform=opening?'rotate(180deg)':'';
    },true);
    card.querySelector('#homebaseBetaBackupButton').addEventListener('click',downloadBackup,true);
  }

  function init(){addBackupCard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();