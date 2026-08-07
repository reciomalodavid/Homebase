(()=>{
  'use strict';

  const BETA_PREFIX='homebase_beta2__';
  const BACKUP_FORMAT='homebase-beta-local-backup';
  const BACKUP_VERSION=2;
  const PENDING_SYNC_SESSION_KEY='homebaseBetaRestorePendingSyncCode';

  const BACKUP_KEYS=[
    'homebase_v2_items',
    'homebase_profiles',
    'homebase_profiles_updated_at',
    'homebase_profile_photos',
    'homebase_roster_visible',
    'homebase_roster_settings',
    'homebase_roster_meta',
    'homebase_sync_code',
    'homebase_expiries_v2'
  ];

  const RESTORE_DATA_KEYS=BACKUP_KEYS.filter(key=>key!=='homebase_sync_code');

  function installStyles(){
    if(document.getElementById('homebaseBetaBackupStyles'))return;
    const style=document.createElement('style');
    style.id='homebaseBetaBackupStyles';
    style.textContent=`
      #homebaseBetaBackupCard .hb-backup-body{padding:0 16px 16px}
      #homebaseBetaBackupCard .hb-backup-copy{margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45}
      #homebaseBetaBackupCard .hb-backup-actions{display:grid;gap:9px}
      #homebaseBetaBackupCard .hb-backup-primary,#homebaseBetaBackupCard .hb-backup-secondary,#homebaseBetaBackupCard .hb-restore-confirm{width:100%;border-radius:13px;padding:13px;font-weight:850}
      #homebaseBetaBackupCard .hb-backup-primary,#homebaseBetaBackupCard .hb-restore-confirm{border:0;background:var(--accent);color:#fff}
      #homebaseBetaBackupCard .hb-backup-secondary{border:1px solid var(--line);background:var(--surface-2);color:var(--text)}
      #homebaseBetaBackupCard .hb-restore-preview,#homebaseBetaBackupCard .hb-restore-paused{margin-top:12px;padding:13px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)}
      #homebaseBetaBackupCard .hb-restore-preview strong,#homebaseBetaBackupCard .hb-restore-paused strong{display:block;margin-bottom:5px}
      #homebaseBetaBackupCard .hb-restore-meta{font-size:12px;color:var(--muted);line-height:1.45}
      #homebaseBetaBackupCard .hb-restore-counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}
      #homebaseBetaBackupCard .hb-restore-count{padding:9px;border-radius:11px;background:var(--surface);font-size:12px;color:var(--muted)}
      #homebaseBetaBackupCard .hb-restore-count b{display:block;font-size:18px;color:var(--text);margin-bottom:2px}
      #homebaseBetaBackupCard .hb-restore-warning{margin:8px 0 11px;font-size:12px;line-height:1.45;color:var(--muted)}
      #homebaseBetaBackupCard .hb-restore-paused{border-color:color-mix(in srgb,var(--accent) 35%,var(--line));}
      #homebaseBetaBackupCard .hb-restore-paused .hb-backup-actions{margin-top:10px}
    `;
    document.head.appendChild(style);
  }

  function betaStorageSnapshot(){
    const storage={};
    for(let i=0;i<localStorage.length;i++){
      const physicalKey=localStorage.key(i);
      if(!physicalKey||!physicalKey.startsWith(BETA_PREFIX))continue;
      const logicalKey=physicalKey.slice(BETA_PREFIX.length);
      if(!BACKUP_KEYS.includes(logicalKey))continue;
      storage[logicalKey]=localStorage.getItem(logicalKey);
    }
    return storage;
  }

  function snapshot(){
    return {
      format:BACKUP_FORMAT,
      version:BACKUP_VERSION,
      environment:'beta',
      createdAt:new Date().toISOString(),
      origin:location.origin,
      localStorage:betaStorageSnapshot()
    };
  }

  function fileName(prefix='homebase-beta-backup'){
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    return `${prefix}-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  }

  function downloadObject(data,name){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=name;
    link.hidden=true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function downloadBackup(event){
    event?.preventDefault();
    event?.stopPropagation();
    try{
      downloadObject(snapshot(),fileName());
    }catch(error){
      console.error('Homebase Beta backup',error);
      alert('No se pudo generar la copia de seguridad en este dispositivo.');
    }
  }

  function parseJsonValue(storage,key,fallback){
    try{
      const raw=storage[key];
      if(raw===undefined||raw===null)return fallback;
      return JSON.parse(raw);
    }catch{return fallback}
  }

  function backupSummary(data){
    const storage=data.localStorage||{};
    const items=parseJsonValue(storage,'homebase_v2_items',[]);
    const profiles=parseJsonValue(storage,'homebase_profiles',[]);
    const photos=parseJsonValue(storage,'homebase_profile_photos',{});
    const expiries=parseJsonValue(storage,'homebase_expiries_v2',[]);
    const roster=parseJsonValue(storage,'homebase_roster_meta',null);
    const events=Array.isArray(items)?items.filter(item=>item?.type==='event'&&!item?.deletedAt).length:0;
    const tasks=Array.isArray(items)?items.filter(item=>item?.type==='task'&&!item?.deletedAt).length:0;
    return {
      events,
      tasks,
      profiles:Array.isArray(profiles)?profiles.length:0,
      photos:photos&&typeof photos==='object'?Object.keys(photos).length:0,
      expiries:Array.isArray(expiries)?expiries.length:0,
      roster:!!roster,
      hasSyncCode:typeof storage.homebase_sync_code==='string'&&storage.homebase_sync_code.length>0
    };
  }

  function validateBackup(data){
    if(!data||typeof data!=='object')throw new Error('El archivo no contiene un backup válido.');
    if(data.format!==BACKUP_FORMAT)throw new Error('Este archivo no es una copia de Homebase Beta.');
    if(data.version!==BACKUP_VERSION)throw new Error(`Esta restauración requiere un backup Beta versión ${BACKUP_VERSION}.`);
    if(data.environment!=='beta')throw new Error('La copia no está identificada como entorno Beta.');
    if(!data.localStorage||typeof data.localStorage!=='object'||Array.isArray(data.localStorage))throw new Error('La copia no contiene datos restaurables.');

    const unknown=Object.keys(data.localStorage).filter(key=>!BACKUP_KEYS.includes(key));
    if(unknown.length)throw new Error('La copia contiene claves no reconocidas y no se restaurará por seguridad.');

    const items=parseJsonValue(data.localStorage,'homebase_v2_items',null);
    if(data.localStorage.homebase_v2_items!==undefined&&!Array.isArray(items))throw new Error('La lista de eventos y pendientes no es válida.');
    const profiles=parseJsonValue(data.localStorage,'homebase_profiles',null);
    if(data.localStorage.homebase_profiles!==undefined&&!Array.isArray(profiles))throw new Error('La lista de perfiles no es válida.');
    const expiries=parseJsonValue(data.localStorage,'homebase_expiries_v2',null);
    if(data.localStorage.homebase_expiries_v2!==undefined&&!Array.isArray(expiries))throw new Error('La lista de vencimientos no es válida.');

    return data;
  }

  function renderPreview(card,data,file){
    const preview=card.querySelector('#homebaseBetaRestorePreview');
    const summary=backupSummary(data);
    const created=data.createdAt?new Date(data.createdAt):null;
    const createdLabel=created&&!Number.isNaN(created.getTime())?created.toLocaleString('es-ES'):'Fecha desconocida';
    preview.hidden=false;
    preview.innerHTML=`
      <strong>Copia lista para revisar</strong>
      <div class="hb-restore-meta">${escapeHtml(file.name)} · ${escapeHtml(createdLabel)}</div>
      <div class="hb-restore-counts">
        <div class="hb-restore-count"><b>${summary.events}</b>eventos</div>
        <div class="hb-restore-count"><b>${summary.tasks}</b>pendientes</div>
        <div class="hb-restore-count"><b>${summary.profiles}</b>perfiles</div>
        <div class="hb-restore-count"><b>${summary.expiries}</b>vencimientos</div>
        <div class="hb-restore-count"><b>${summary.photos}</b>fotos</div>
        <div class="hb-restore-count"><b>${summary.roster?'Sí':'No'}</b>roster</div>
      </div>
      <div class="hb-restore-warning">Antes de restaurar se descargará automáticamente una copia del estado actual. Después, la sincronización familiar quedará en pausa para evitar que Firebase sobrescriba la recuperación.</div>
      <button type="button" class="hb-restore-confirm" id="homebaseBetaRestoreConfirm">Restaurar esta copia</button>`;

    preview.querySelector('#homebaseBetaRestoreConfirm').onclick=()=>restoreBackup(data);
  }

  function restoreBackup(data){
    if(!confirm('¿Restaurar esta copia en Homebase Beta? Primero se descargará una copia del estado actual. Producción no se modificará.'))return;

    try{
      const before=snapshot();
      downloadObject(before,fileName('homebase-beta-before-restore'));

      const currentSyncCode=localStorage.getItem('homebase_sync_code')||'';
      const backupSyncCode=typeof data.localStorage.homebase_sync_code==='string'?data.localStorage.homebase_sync_code:'';
      const pendingSyncCode=backupSyncCode||currentSyncCode;
      if(pendingSyncCode)sessionStorage.setItem(PENDING_SYNC_SESSION_KEY,pendingSyncCode);
      else sessionStorage.removeItem(PENDING_SYNC_SESSION_KEY);

      localStorage.removeItem('homebase_sync_code');

      for(const key of RESTORE_DATA_KEYS)localStorage.removeItem(key);
      for(const key of RESTORE_DATA_KEYS){
        if(!Object.prototype.hasOwnProperty.call(data.localStorage,key))continue;
        const value=data.localStorage[key];
        if(typeof value==='string')localStorage.setItem(key,value);
      }

      sessionStorage.setItem('homebaseBetaRestoreJustCompleted','1');
      location.reload();
    }catch(error){
      console.error('Homebase Beta restore',error);
      alert('No se pudo completar la restauración. La copia previa ya se ha intentado descargar.');
    }
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[char]));
  }

  function showRestorePausedState(card){
    const pendingCode=sessionStorage.getItem(PENDING_SYNC_SESSION_KEY)||'';
    const justCompleted=sessionStorage.getItem('homebaseBetaRestoreJustCompleted')==='1';
    if(!pendingCode&&!justCompleted)return;

    sessionStorage.removeItem('homebaseBetaRestoreJustCompleted');
    const box=card.querySelector('#homebaseBetaRestorePaused');
    box.hidden=false;
    box.innerHTML=`
      <strong>Restauración aplicada</strong>
      <div class="hb-restore-meta">Comprueba primero que eventos, perfiles, roster y vencimientos estén correctos. La sincronización familiar está en pausa para proteger lo restaurado.</div>
      ${pendingCode?`<div class="hb-backup-actions"><button type="button" class="hb-backup-secondary" id="homebaseBetaResumeSync">Reactivar sincronización familiar</button></div>`:''}`;

    const resume=box.querySelector('#homebaseBetaResumeSync');
    if(resume)resume.onclick=()=>{
      if(!confirm('¿Reactivar ahora la sincronización familiar? Firebase volverá a combinar los datos de esta Beta con la copia remota.'))return;
      localStorage.setItem('homebase_sync_code',pendingCode);
      sessionStorage.removeItem(PENDING_SYNC_SESSION_KEY);
      location.reload();
    };
  }

  function addBackupCard(){
    if(document.getElementById('homebaseBetaBackupCard'))return;
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(page=>/Sincronización familiar/i.test(page.textContent||''))||pages.at(-1);
    if(!target)return;

    installStyles();

    const card=document.createElement('section');
    card.id='homebaseBetaBackupCard';
    card.className='section card';
    card.style.cssText='padding:0;overflow:hidden';
    card.innerHTML=`
      <button type="button" id="homebaseBetaBackupToggle" aria-expanded="false" style="width:100%;min-height:72px;padding:14px 16px;border:0;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:space-between;text-align:left">
        <span><strong style="display:block;font-size:17px">Copia de seguridad</strong><span style="display:block;margin-top:3px;color:var(--muted);font-size:12px">Guardar y recuperar datos de esta Beta</span></span>
        <span aria-hidden="true" style="font-size:20px;color:var(--muted);transition:transform .2s">⌄</span>
      </button>
      <div id="homebaseBetaBackupBody" class="hb-backup-body" hidden>
        <p class="hb-backup-copy">Descarga una copia de los datos Beta o recupera una copia anterior. Nunca modifica los datos de producción.</p>
        <div class="hb-backup-actions">
          <button type="button" id="homebaseBetaBackupButton" class="hb-backup-primary">Descargar copia de seguridad</button>
          <button type="button" id="homebaseBetaRestoreButton" class="hb-backup-secondary">Restaurar una copia</button>
        </div>
        <input type="file" id="homebaseBetaRestoreInput" accept="application/json,.json" hidden>
        <div id="homebaseBetaRestorePreview" class="hb-restore-preview" hidden></div>
        <div id="homebaseBetaRestorePaused" class="hb-restore-paused" hidden></div>
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

    const restoreButton=card.querySelector('#homebaseBetaRestoreButton');
    const restoreInput=card.querySelector('#homebaseBetaRestoreInput');
    restoreButton.onclick=()=>restoreInput.click();
    restoreInput.onchange=async()=>{
      const file=restoreInput.files?.[0];
      restoreInput.value='';
      if(!file)return;
      try{
        if(file.size>15*1024*1024)throw new Error('La copia supera 15 MB y no se abrirá por seguridad.');
        const text=await file.text();
        const data=validateBackup(JSON.parse(text));
        renderPreview(card,data,file);
        body.hidden=false;
        toggle.setAttribute('aria-expanded','true');
        chevron.style.transform='rotate(180deg)';
      }catch(error){
        console.error('Homebase Beta restore validation',error);
        alert(error?.message||'No se pudo leer esta copia de seguridad.');
      }
    };

    showRestorePausedState(card);
  }

  function init(){addBackupCard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();