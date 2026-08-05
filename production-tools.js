(()=>{
  'use strict';

  function snapshot(){
    const storage={};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key!==null)storage[key]=localStorage.getItem(key);
    }
    return {
      format:'homebase-local-backup',
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
    return `homebase-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
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
      link.style.display='none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){
      console.error('Homebase backup',error);
      alert('No se pudo generar la copia de seguridad en este dispositivo.');
    }
  }

  function addBackupCard(){
    if(document.getElementById('homebaseBackupCard'))return;
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(page=>/Sincronización familiar/i.test(page.textContent||''))||pages.at(-1);
    if(!target)return;

    const card=document.createElement('section');
    card.id='homebaseBackupCard';
    card.className='section';
    card.innerHTML=`
      <div class="card" style="overflow:hidden">
        <button type="button" id="homebaseBackupToggle" aria-expanded="false" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;border:0;background:transparent;padding:16px;color:var(--text);text-align:left">
          <span><strong style="display:block;font-size:16px">Copia de seguridad</strong><span style="display:block;margin-top:3px;color:var(--muted);font-size:12px">Datos de este dispositivo</span></span>
          <span id="homebaseBackupChevron" aria-hidden="true" style="font-size:18px;color:var(--muted);transition:transform .18s ease">⌄</span>
        </button>
        <div id="homebaseBackupBody" hidden style="padding:0 16px 16px">
          <p style="margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45">Descarga una copia de todos los datos locales de Homebase sin modificar ni borrar nada.</p>
          <button type="button" id="homebaseBackupButton" style="width:100%;border:0;border-radius:13px;padding:13px;background:var(--accent);color:#fff;font-weight:850">Descargar copia de seguridad</button>
        </div>
      </div>`;
    target.appendChild(card);

    const toggle=card.querySelector('#homebaseBackupToggle');
    const body=card.querySelector('#homebaseBackupBody');
    const chevron=card.querySelector('#homebaseBackupChevron');
    toggle.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const opening=body.hidden;
      body.hidden=!opening;
      toggle.setAttribute('aria-expanded',String(opening));
      chevron.style.transform=opening?'rotate(180deg)':'none';
    },true);
    card.querySelector('#homebaseBackupButton').addEventListener('click',downloadBackup,true);
  }

  function init(){addBackupCard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();