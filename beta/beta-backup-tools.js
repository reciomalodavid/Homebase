(()=>{
  'use strict';

  const BETA_PREFIX='homebase_beta2__';
  const BACKUP_FORMAT='homebase-beta-local-backup';
  const BACKUP_VERSION=2;
  const CLOUD_BACKUP_VERSION=1;
  const CLOUD_BACKUP_ROOT='homebaseBackups';
  const CLOUD_KEEP=30;
  const CHUNK_SIZE=350000;
  const AUTO_MIN_INTERVAL_MS=5*60*1000;
  const AUTO_DEBOUNCE_MS=12000;
  const PENDING_SYNC_SESSION_KEY='homebaseBetaRestorePendingSyncCode';
  const LAST_HASH_KEY='homebase_backup_cloud_last_hash';
  const LAST_AT_KEY='homebase_backup_cloud_last_at';

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

  let autoTimer=null;
  let cloudBusy=false;
  let cloudRows=[];

  function byId(id){return document.getElementById(id)}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}

  function installStyles(){
    if(byId('homebaseBetaBackupStyles'))return;
    const style=document.createElement('style');
    style.id='homebaseBetaBackupStyles';
    style.textContent=`
      #homebaseBetaBackupCard .hb-backup-body{padding:0 16px 16px}
      #homebaseBetaBackupCard .hb-backup-copy{margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45}
      #homebaseBetaBackupCard .hb-backup-actions{display:grid;gap:9px}
      #homebaseBetaBackupCard button{font:inherit}
      #homebaseBetaBackupCard .hb-backup-primary,#homebaseBetaBackupCard .hb-backup-secondary,#homebaseBetaBackupCard .hb-restore-confirm{width:100%;border-radius:13px;padding:13px;font-weight:850}
      #homebaseBetaBackupCard .hb-backup-primary,#homebaseBetaBackupCard .hb-restore-confirm{border:0;background:var(--accent);color:#fff}
      #homebaseBetaBackupCard .hb-backup-secondary{border:1px solid var(--line);background:var(--surface-2);color:var(--text)}
      #homebaseBetaBackupCard .hb-cloud-status,#homebaseBetaBackupCard .hb-restore-preview,#homebaseBetaBackupCard .hb-restore-paused{margin-top:12px;padding:13px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)}
      #homebaseBetaBackupCard .hb-cloud-status strong,#homebaseBetaBackupCard .hb-restore-preview strong,#homebaseBetaBackupCard .hb-restore-paused strong{display:block;margin-bottom:5px}
      #homebaseBetaBackupCard .hb-restore-meta{font-size:12px;color:var(--muted);line-height:1.45}
      #homebaseBetaBackupCard .hb-cloud-list{display:grid;gap:8px;margin-top:10px}
      #homebaseBetaBackupCard .hb-cloud-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:12px;padding:11px}
      #homebaseBetaBackupCard .hb-cloud-row span{display:block}
      #homebaseBetaBackupCard .hb-cloud-row small{display:block;margin-top:2px;color:var(--muted);font-size:11px}
      #homebaseBetaBackupCard .hb-cloud-row b{font-size:17px;color:var(--muted)}
      #homebaseBetaBackupCard .hb-restore-counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}
      #homebaseBetaBackupCard .hb-restore-count{padding:9px;border-radius:11px;background:var(--surface);font-size:12px;color:var(--muted)}
      #homebaseBetaBackupCard .hb-restore-count b{display:block;font-size:18px;color:var(--text);margin-bottom:2px}
      #homebaseBetaBackupCard .hb-restore-warning{margin:8px 0 11px;font-size:12px;line-height:1.45;color:var(--muted)}
      #homebaseBetaBackupCard .hb-restore-paused{border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}
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
    return {
      events:Array.isArray(items)?items.filter(item=>item?.type==='event'&&!item?.deletedAt).length:0,
      tasks:Array.isArray(items)?items.filter(item=>item?.type==='task'&&!item?.deletedAt).length:0,
      profiles:Array.isArray(profiles)?profiles.length:0,
      photos:photos&&typeof photos==='object'?Object.keys(photos).length:0,
      expiries:Array.isArray(expiries)?expiries.length:0,
      roster:!!roster
    };
  }

  function validateBackup(data){
    if(!data||typeof data!=='object')throw new Error('La copia no contiene datos válidos.');
    if(data.format!==BACKUP_FORMAT||data.version!==BACKUP_VERSION||data.environment!=='beta')throw new Error('Esta copia no corresponde a Homebase Beta actual.');
    if(!data.localStorage||typeof data.localStorage!=='object'||Array.isArray(data.localStorage))throw new Error('La copia no contiene datos restaurables.');
    const unknown=Object.keys(data.localStorage).filter(key=>!BACKUP_KEYS.includes(key));
    if(unknown.length)throw new Error('La copia contiene claves no reconocidas.');
    const items=parseJsonValue(data.localStorage,'homebase_v2_items',null);
    if(data.localStorage.homebase_v2_items!==undefined&&!Array.isArray(items))throw new Error('Eventos y pendientes no son válidos.');
    const profiles=parseJsonValue(data.localStorage,'homebase_profiles',null);
    if(data.localStorage.homebase_profiles!==undefined&&!Array.isArray(profiles))throw new Error('Los perfiles no son válidos.');
    const expiries=parseJsonValue(data.localStorage,'homebase_expiries_v2',null);
    if(data.localStorage.homebase_expiries_v2!==undefined&&!Array.isArray(expiries))throw new Error('Los vencimientos no son válidos.');
    return data;
  }

  async function ensureCloudReady(){
    if(!window.HOMEBASE_BETA||!window.cloudDb&&!globalThis.cloudDb)throw new Error('Firebase todavía no está disponible.');
    if(!state?.syncCode)throw new Error('Vincula primero la sincronización familiar en Beta.');
    if(window.HOMEBASE_BETA_SECURITY?.ensureAuth)await window.HOMEBASE_BETA_SECURITY.ensureAuth();
    if(!firebase.auth?.().currentUser)throw new Error('No hay una sesión autenticada para guardar copias.');
    return firebase.auth().currentUser;
  }

  function homeId(){return `BETA_${state.syncCode}`}
  function snapshotsRef(){return cloudDb.collection(CLOUD_BACKUP_ROOT).doc(homeId()).collection('snapshots')}

  function stableBackupString(){
    return JSON.stringify({format:BACKUP_FORMAT,version:BACKUP_VERSION,environment:'beta',localStorage:betaStorageSnapshot()});
  }

  async function hashString(value){
    if(crypto?.subtle){
      const bytes=new TextEncoder().encode(value);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    let h=2166136261;
    for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}
    return `fallback-${(h>>>0).toString(16)}`;
  }

  function splitChunks(text){
    const chunks=[];
    for(let i=0;i<text.length;i+=CHUNK_SIZE)chunks.push(text.slice(i,i+CHUNK_SIZE));
    return chunks.length?chunks:[''];
  }

  function cloudStatus(text,isError=false){
    const el=byId('homebaseBetaCloudStatusText');
    if(!el)return;
    el.textContent=text;
    el.style.color=isError?'#b42318':'';
  }

  async function createCloudSnapshot({force=false,reason='automatic'}={}){
    if(cloudBusy||!navigator.onLine)return false;
    cloudBusy=true;
    try{
      const user=await ensureCloudReady();
      const stable=stableBackupString();
      const hash=await hashString(stable);
      const lastHash=localStorage.getItem(LAST_HASH_KEY)||'';
      const lastAt=Number(localStorage.getItem(LAST_AT_KEY)||0);
      if(!force&&hash===lastHash)return false;
      if(!force&&lastAt&&Date.now()-lastAt<AUTO_MIN_INTERVAL_MS)return false;

      const data=snapshot();
      const serialized=JSON.stringify(data);
      const chunks=splitChunks(serialized);
      const createdAt=Date.now();
      const id=`${createdAt}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;
      const ref=snapshotsRef().doc(id);
      const summary=backupSummary(data);

      for(let i=0;i<chunks.length;i++){
        await ref.collection('chunks').doc(String(i).padStart(4,'0')).set({index:i,data:chunks[i]});
      }
      await ref.set({
        backupVersion:CLOUD_BACKUP_VERSION,
        format:BACKUP_FORMAT,
        environment:'beta',
        createdAt,
        createdByUid:user.uid,
        reason,
        hash,
        chunkCount:chunks.length,
        byteLength:new Blob([serialized]).size,
        summary
      });

      localStorage.setItem(LAST_HASH_KEY,hash);
      localStorage.setItem(LAST_AT_KEY,String(createdAt));
      cloudStatus(`Copia automática guardada · ${new Date(createdAt).toLocaleString('es-ES')}`);
      cleanupOldSnapshots().catch(error=>console.warn('Beta cloud backup cleanup',error));
      return true;
    }catch(error){
      console.error('Homebase Beta cloud backup',error);
      cloudStatus(`No se pudo guardar la copia automática: ${error?.message||error}`,true);
      return false;
    }finally{cloudBusy=false}
  }

  async function cleanupOldSnapshots(){
    await ensureCloudReady();
    const snap=await snapshotsRef().orderBy('createdAt','desc').get();
    const old=snap.docs.slice(CLOUD_KEEP);
    for(const doc of old){
      const chunks=await doc.ref.collection('chunks').get();
      for(const chunk of chunks.docs)await chunk.ref.delete();
      await doc.ref.delete();
    }
  }

  async function loadCloudSnapshot(docId){
    await ensureCloudReady();
    const ref=snapshotsRef().doc(docId);
    const manifest=await ref.get();
    if(!manifest.exists)throw new Error('Esa copia ya no existe.');
    const meta=manifest.data()||{};
    if(meta.format!==BACKUP_FORMAT||meta.environment!=='beta')throw new Error('La copia remota no es válida para Beta.');
    const chunksSnap=await ref.collection('chunks').orderBy('index').get();
    if(!chunksSnap.size)throw new Error('La copia remota está incompleta.');
    const serialized=chunksSnap.docs.map(doc=>String(doc.data()?.data||'')).join('');
    return validateBackup(JSON.parse(serialized));
  }

  async function listCloudSnapshots(){
    const list=byId('homebaseBetaCloudList');
    if(!list)return;
    list.innerHTML='<div class="hb-restore-meta">Buscando versiones…</div>';
    try{
      await ensureCloudReady();
      const snap=await snapshotsRef().orderBy('createdAt','desc').limit(CLOUD_KEEP).get();
      cloudRows=snap.docs.map(doc=>({id:doc.id,...doc.data()}));
      if(!cloudRows.length){
        list.innerHTML='<div class="hb-restore-meta">Todavía no hay copias automáticas. Se crearán cuando haya cambios.</div>';
        return;
      }
      list.innerHTML=cloudRows.map(row=>{
        const s=row.summary||{};
        const label=new Date(Number(row.createdAt)||0).toLocaleString('es-ES');
        const reason=row.reason==='pre-restore'?'Antes de restaurar':'Automática';
        return `<button type="button" class="hb-cloud-row" data-cloud-restore="${escapeHtml(row.id)}"><span><strong>${escapeHtml(label)}</strong><small>${reason} · ${Number(s.events||0)} eventos · ${Number(s.tasks||0)} pendientes · ${Number(s.expiries||0)} vencimientos</small></span><b>›</b></button>`;
      }).join('');
      list.querySelectorAll('[data-cloud-restore]').forEach(button=>button.onclick=()=>previewCloudRestore(button.dataset.cloudRestore));
    }catch(error){
      console.error('Homebase Beta cloud list',error);
      list.innerHTML=`<div class="hb-restore-meta">No se pudo leer el historial: ${escapeHtml(error?.message||error)}</div>`;
    }
  }

  function renderDataPreview(data,title,onConfirm){
    const preview=byId('homebaseBetaRestorePreview');
    const summary=backupSummary(data);
    const created=data.createdAt?new Date(data.createdAt):null;
    const createdLabel=created&&!Number.isNaN(created.getTime())?created.toLocaleString('es-ES'):'Fecha desconocida';
    preview.hidden=false;
    preview.innerHTML=`
      <strong>${escapeHtml(title)}</strong>
      <div class="hb-restore-meta">${escapeHtml(createdLabel)}</div>
      <div class="hb-restore-counts">
        <div class="hb-restore-count"><b>${summary.events}</b>eventos</div>
        <div class="hb-restore-count"><b>${summary.tasks}</b>pendientes</div>
        <div class="hb-restore-count"><b>${summary.profiles}</b>perfiles</div>
        <div class="hb-restore-count"><b>${summary.expiries}</b>vencimientos</div>
        <div class="hb-restore-count"><b>${summary.photos}</b>fotos</div>
        <div class="hb-restore-count"><b>${summary.roster?'Sí':'No'}</b>roster</div>
      </div>
      <div class="hb-restore-warning">Antes de restaurar se guardará automáticamente en Firebase otra versión del estado actual. Después la sincronización quedará en pausa para que puedas comprobar el resultado.</div>
      <button type="button" class="hb-restore-confirm" id="homebaseBetaRestoreConfirm">Restaurar esta versión</button>`;
    byId('homebaseBetaRestoreConfirm').onclick=onConfirm;
  }

  async function previewCloudRestore(docId){
    const preview=byId('homebaseBetaRestorePreview');
    preview.hidden=false;
    preview.innerHTML='<strong>Cargando versión…</strong><div class="hb-restore-meta">Leyendo la copia segura de Firebase.</div>';
    try{
      const data=await loadCloudSnapshot(docId);
      renderDataPreview(data,'Versión lista para restaurar',()=>restoreBackup(data,{cloud:true}));
    }catch(error){
      preview.innerHTML=`<strong>No se pudo abrir</strong><div class="hb-restore-meta">${escapeHtml(error?.message||error)}</div>`;
    }
  }

  async function restoreBackup(data,{cloud=false}={}){
    if(!confirm('¿Restaurar esta versión en Homebase Beta? Producción no se modificará.'))return;
    try{
      cloudStatus('Guardando una copia del estado actual antes de restaurar…');
      const protectedCopy=await createCloudSnapshot({force:true,reason:'pre-restore'});
      if(!protectedCopy&&cloud)throw new Error('No se pudo crear la copia de seguridad previa en Firebase. Restauración cancelada.');

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
      localStorage.removeItem(LAST_HASH_KEY);
      sessionStorage.setItem('homebaseBetaRestoreJustCompleted','1');
      location.reload();
    }catch(error){
      console.error('Homebase Beta restore',error);
      alert(error?.message||'No se pudo completar la restauración.');
    }
  }

  function showRestorePausedState(card){
    const pendingCode=sessionStorage.getItem(PENDING_SYNC_SESSION_KEY)||'';
    const justCompleted=sessionStorage.getItem('homebaseBetaRestoreJustCompleted')==='1';
    if(!pendingCode&&!justCompleted)return;
    sessionStorage.removeItem('homebaseBetaRestoreJustCompleted');
    const box=card.querySelector('#homebaseBetaRestorePaused');
    box.hidden=false;
    box.innerHTML=`<strong>Restauración aplicada</strong><div class="hb-restore-meta">Comprueba eventos, perfiles, roster y vencimientos. La sincronización familiar está en pausa para proteger lo restaurado.</div>${pendingCode?'<div class="hb-backup-actions"><button type="button" class="hb-backup-secondary" id="homebaseBetaResumeSync">Reactivar sincronización familiar</button></div>':''}`;
    const resume=byId('homebaseBetaResumeSync');
    if(resume)resume.onclick=()=>{
      if(!confirm('¿Reactivar ahora la sincronización familiar? Firebase volverá a combinar los datos de esta Beta con el estado remoto.'))return;
      localStorage.setItem('homebase_sync_code',pendingCode);
      sessionStorage.removeItem(PENDING_SYNC_SESSION_KEY);
      location.reload();
    };
  }

  function queueAutoSnapshot(){
    clearTimeout(autoTimer);
    autoTimer=setTimeout(()=>createCloudSnapshot({reason:'automatic'}),AUTO_DEBOUNCE_MS);
  }

  function hookChanges(){
    if(typeof window.scheduleCloudSave==='function'&&!window.scheduleCloudSave.__homebaseBackupWrapped){
      const original=window.scheduleCloudSave;
      const wrapped=function(...args){const result=original.apply(this,args);queueAutoSnapshot();return result};
      wrapped.__homebaseBackupWrapped=true;
      window.scheduleCloudSave=wrapped;
    }
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueAutoSnapshot()});
    window.addEventListener('online',queueAutoSnapshot);
    window.addEventListener('focus',queueAutoSnapshot);
    setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)createCloudSnapshot({reason:'automatic'})},60000);
  }

  function addBackupCard(){
    if(byId('homebaseBetaBackupCard'))return;
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
        <span><strong style="display:block;font-size:17px">Copia de seguridad</strong><span style="display:block;margin-top:3px;color:var(--muted);font-size:12px">Automática y recuperable desde Firebase</span></span>
        <span aria-hidden="true" style="font-size:20px;color:var(--muted);transition:transform .2s">⌄</span>
      </button>
      <div id="homebaseBetaBackupBody" class="hb-backup-body" hidden>
        <p class="hb-backup-copy">Homebase Beta guarda versiones automáticamente cuando detecta cambios. Conserva hasta ${CLOUD_KEEP} versiones. La descarga JSON queda solo como copia manual de emergencia.</p>
        <div class="hb-cloud-status"><strong>Backup automático</strong><div id="homebaseBetaCloudStatusText" class="hb-restore-meta">Preparando Firebase…</div></div>
        <div class="hb-backup-actions" style="margin-top:10px">
          <button type="button" id="homebaseBetaCloudRefresh" class="hb-backup-secondary">Ver versiones guardadas</button>
          <button type="button" id="homebaseBetaCloudNow" class="hb-backup-secondary">Guardar una versión ahora</button>
        </div>
        <div id="homebaseBetaCloudList" class="hb-cloud-list"></div>
        <details style="margin-top:12px"><summary style="font-size:12px;color:var(--muted);cursor:pointer">Opciones manuales de emergencia</summary><div class="hb-backup-actions" style="margin-top:9px"><button type="button" id="homebaseBetaBackupButton" class="hb-backup-secondary">Descargar JSON</button><button type="button" id="homebaseBetaRestoreButton" class="hb-backup-secondary">Restaurar JSON</button></div><input type="file" id="homebaseBetaRestoreInput" accept="application/json,.json" hidden></details>
        <div id="homebaseBetaRestorePreview" class="hb-restore-preview" hidden></div>
        <div id="homebaseBetaRestorePaused" class="hb-restore-paused" hidden></div>
      </div>`;
    target.appendChild(card);

    const toggle=byId('homebaseBetaBackupToggle');
    const body=byId('homebaseBetaBackupBody');
    const chevron=toggle.lastElementChild;
    toggle.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      const opening=body.hidden;body.hidden=!opening;toggle.setAttribute('aria-expanded',String(opening));chevron.style.transform=opening?'rotate(180deg)':'';
      if(opening)listCloudSnapshots();
    },true);

    byId('homebaseBetaCloudRefresh').onclick=listCloudSnapshots;
    byId('homebaseBetaCloudNow').onclick=async()=>{cloudStatus('Guardando versión…');await createCloudSnapshot({force:true,reason:'manual'});await listCloudSnapshots()};

    byId('homebaseBetaBackupButton').onclick=()=>{
      const data=snapshot();
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`homebase-beta-backup-${new Date().toISOString().slice(0,10)}.json`;link.hidden=true;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };

    const restoreInput=byId('homebaseBetaRestoreInput');
    byId('homebaseBetaRestoreButton').onclick=()=>restoreInput.click();
    restoreInput.onchange=async()=>{
      const file=restoreInput.files?.[0];restoreInput.value='';if(!file)return;
      try{
        if(file.size>15*1024*1024)throw new Error('La copia supera 15 MB.');
        const data=validateBackup(JSON.parse(await file.text()));
        renderDataPreview(data,'Copia JSON lista para restaurar',()=>restoreBackup(data,{cloud:false}));
      }catch(error){alert(error?.message||'No se pudo leer esta copia.')}
    };

    showRestorePausedState(card);
  }

  function init(){
    addBackupCard();
    hookChanges();
    setTimeout(async()=>{
      if(!state?.syncCode){cloudStatus('Activa la sincronización familiar Beta para guardar copias remotas.');return}
      await createCloudSnapshot({reason:'automatic'});
      const lastAt=Number(localStorage.getItem(LAST_AT_KEY)||0);
      if(lastAt)cloudStatus(`Protección automática activa · última copia ${new Date(lastAt).toLocaleString('es-ES')}`);
    },8000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();