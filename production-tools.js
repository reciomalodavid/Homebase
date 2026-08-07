(()=>{
  'use strict';

  const BACKUP_FORMAT='homebase-production-backup';
  const BACKUP_VERSION=2;
  const LEGACY_FORMAT='homebase-local-backup';
  const CLOUD_BACKUP_ROOT='homebaseBackups';
  const CLOUD_KEEP=30;
  const CHUNK_SIZE=350000;
  const AUTO_MIN_INTERVAL_MS=5*60*1000;
  const AUTO_DEBOUNCE_MS=12000;
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
    'homebase_expiries_v1',
    'homebase_expiries_updated_at'
  ];
  const RESTORE_DATA_KEYS=BACKUP_KEYS.filter(key=>key!=='homebase_sync_code');

  let autoTimer=null;
  let cloudBusy=false;
  let cloudRows=[];

  function byId(id){return document.getElementById(id)}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
  function syncCode(){return String(localStorage.getItem('homebase_sync_code')||'').trim()}
  function db(){try{return window.firebase?.firestore?.()||null}catch{return null}}
  function familyRef(){const code=syncCode(),store=db();return code&&store?store.collection('homebaseSyncs').doc(code):null}
  function snapshotsRef(){const code=syncCode(),store=db();return code&&store?store.collection(CLOUD_BACKUP_ROOT).doc(code).collection('snapshots'):null}

  function installStyles(){
    if(byId('homebaseBackupStyles'))return;
    const style=document.createElement('style');
    style.id='homebaseBackupStyles';
    style.textContent=`
      #homebaseBackupCard .hb-backup-body{padding:0 16px 16px}
      #homebaseBackupCard .hb-backup-copy{margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45}
      #homebaseBackupCard .hb-backup-actions{display:grid;gap:9px}
      #homebaseBackupCard button{font:inherit}
      #homebaseBackupCard .hb-backup-primary,#homebaseBackupCard .hb-backup-secondary,#homebaseBackupCard .hb-restore-confirm{width:100%;border-radius:13px;padding:13px;font-weight:850}
      #homebaseBackupCard .hb-backup-primary,#homebaseBackupCard .hb-restore-confirm{border:0;background:var(--accent);color:#fff}
      #homebaseBackupCard .hb-backup-secondary{border:1px solid var(--line);background:var(--surface-2);color:var(--text)}
      #homebaseBackupCard .hb-cloud-status,#homebaseBackupCard .hb-restore-preview{margin-top:12px;padding:13px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)}
      #homebaseBackupCard .hb-cloud-status strong,#homebaseBackupCard .hb-restore-preview strong{display:block;margin-bottom:5px}
      #homebaseBackupCard .hb-restore-meta{font-size:12px;color:var(--muted);line-height:1.45}
      #homebaseBackupCard .hb-cloud-list{display:grid;gap:8px;margin-top:10px}
      #homebaseBackupCard .hb-cloud-list[hidden]{display:none}
      #homebaseBackupCard .hb-cloud-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:12px;padding:11px}
      #homebaseBackupCard .hb-cloud-row span{display:block}
      #homebaseBackupCard .hb-cloud-row small{display:block;margin-top:2px;color:var(--muted);font-size:11px;line-height:1.35}
      #homebaseBackupCard .hb-cloud-row b{font-size:17px;color:var(--muted)}
      #homebaseBackupCard .hb-restore-counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}
      #homebaseBackupCard .hb-restore-count{padding:9px;border-radius:11px;background:var(--surface);font-size:12px;color:var(--muted)}
      #homebaseBackupCard .hb-restore-count b{display:block;font-size:18px;color:var(--text);margin-bottom:2px}
      #homebaseBackupCard .hb-restore-warning{margin:8px 0 11px;font-size:12px;line-height:1.45;color:var(--muted)}
    `;
    document.head.appendChild(style);
  }

  function storageSnapshot(){
    const storage={};
    for(const key of BACKUP_KEYS)storage[key]=localStorage.getItem(key);
    return storage;
  }

  function snapshot(){
    return {
      format:BACKUP_FORMAT,
      version:BACKUP_VERSION,
      environment:'production',
      createdAt:new Date().toISOString(),
      localStorage:storageSnapshot()
    };
  }

  function parseJsonValue(storage,key,fallback){
    try{
      const raw=storage[key];
      if(raw===undefined||raw===null||raw==='')return fallback;
      return JSON.parse(raw);
    }catch{return fallback}
  }

  function backupSummary(data){
    const storage=data.localStorage||{};
    const items=parseJsonValue(storage,'homebase_v2_items',[]);
    const profiles=parseJsonValue(storage,'homebase_profiles',[]);
    const photos=parseJsonValue(storage,'homebase_profile_photos',{});
    const expiries=parseJsonValue(storage,'homebase_expiries_v1',[]);
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

  function normalizeBackup(data){
    if(!data||typeof data!=='object')throw new Error('La copia no contiene datos válidos.');
    if(!data.localStorage||typeof data.localStorage!=='object'||Array.isArray(data.localStorage))throw new Error('La copia no contiene datos restaurables.');

    if(data.format===BACKUP_FORMAT&&data.version===BACKUP_VERSION&&data.environment==='production'){
      const unknown=Object.keys(data.localStorage).filter(key=>!BACKUP_KEYS.includes(key));
      if(unknown.length)throw new Error('La copia contiene claves no reconocidas.');
      return data;
    }

    if(data.format===LEGACY_FORMAT&&data.version===1){
      const storage={};
      for(const key of BACKUP_KEYS){
        if(Object.prototype.hasOwnProperty.call(data.localStorage,key))storage[key]=data.localStorage[key];
      }
      return {format:BACKUP_FORMAT,version:BACKUP_VERSION,environment:'production',createdAt:data.createdAt||new Date().toISOString(),legacy:true,localStorage:storage};
    }

    throw new Error('Esta copia no corresponde a una versión compatible de Homebase.');
  }

  function validateBackup(data){
    const normalized=normalizeBackup(data);
    const storage=normalized.localStorage;
    const items=parseJsonValue(storage,'homebase_v2_items',null);
    if(storage.homebase_v2_items!==undefined&&storage.homebase_v2_items!==null&&!Array.isArray(items))throw new Error('Eventos y pendientes no son válidos.');
    const profiles=parseJsonValue(storage,'homebase_profiles',null);
    if(storage.homebase_profiles!==undefined&&storage.homebase_profiles!==null&&!Array.isArray(profiles))throw new Error('Los perfiles no son válidos.');
    const expiries=parseJsonValue(storage,'homebase_expiries_v1',null);
    if(storage.homebase_expiries_v1!==undefined&&storage.homebase_expiries_v1!==null&&!Array.isArray(expiries))throw new Error('Los vencimientos no son válidos.');
    return normalized;
  }

  async function ensureCloudReady(){
    const ref=snapshotsRef();
    if(!ref)throw new Error('Activa primero la sincronización familiar.');
    if(window.HOMEBASE_SECURITY?.ensureAuth)await window.HOMEBASE_SECURITY.ensureAuth();
    else if(typeof firebase?.auth==='function'&&!firebase.auth().currentUser)await firebase.auth().signInAnonymously();
    if(typeof firebase?.auth==='function'&&!firebase.auth().currentUser)throw new Error('No se pudo iniciar la sesión segura de Firebase.');
    return ref;
  }

  function stableBackupString(){
    return JSON.stringify({format:BACKUP_FORMAT,version:BACKUP_VERSION,environment:'production',localStorage:storageSnapshot()});
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
    const el=byId('homebaseCloudStatusText');
    if(!el)return;
    el.textContent=text;
    el.style.color=isError?'#b42318':'';
  }

  async function saveSnapshotData(data,{reason='automatic',force=false}={}){
    if(cloudBusy||!navigator.onLine)return false;
    cloudBusy=true;
    try{
      const ref=await ensureCloudReady();
      const stable=JSON.stringify({format:data.format,version:data.version,environment:data.environment,localStorage:data.localStorage});
      const hash=await hashString(stable);
      const lastHash=localStorage.getItem(LAST_HASH_KEY)||'';
      const lastAt=Number(localStorage.getItem(LAST_AT_KEY)||0);
      if(!force&&hash===lastHash)return false;
      if(!force&&lastAt&&Date.now()-lastAt<AUTO_MIN_INTERVAL_MS)return false;

      const serialized=JSON.stringify(data);
      const chunks=splitChunks(serialized);
      const createdAt=Date.now();
      const id=`${createdAt}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;
      const doc=ref.doc(id);
      const summary=backupSummary(data);

      for(let i=0;i<chunks.length;i++){
        await doc.collection('chunks').doc(String(i).padStart(4,'0')).set({index:i,data:chunks[i]});
      }
      await doc.set({
        backupVersion:BACKUP_VERSION,
        format:BACKUP_FORMAT,
        environment:'production',
        createdAt,
        createdByUid:firebase.auth?.().currentUser?.uid||'',
        reason,
        hash,
        chunkCount:chunks.length,
        byteLength:new Blob([serialized]).size,
        summary
      });

      localStorage.setItem(LAST_HASH_KEY,hash);
      localStorage.setItem(LAST_AT_KEY,String(createdAt));
      cloudStatus(`Protección automática activa · última copia ${new Date(createdAt).toLocaleString('es-ES')}`);
      cleanupOldSnapshots().catch(error=>console.warn('Homebase cloud backup cleanup',error));
      return true;
    }catch(error){
      console.error('Homebase cloud backup',error);
      cloudStatus(`No se pudo guardar la copia automática: ${error?.message||error}`,true);
      return false;
    }finally{cloudBusy=false}
  }

  function createCloudSnapshot(options={}){return saveSnapshotData(snapshot(),options)}

  async function cleanupOldSnapshots(){
    const ref=await ensureCloudReady();
    const snap=await ref.orderBy('createdAt','desc').get();
    for(const doc of snap.docs.slice(CLOUD_KEEP)){
      const chunks=await doc.ref.collection('chunks').get();
      for(const chunk of chunks.docs)await chunk.ref.delete();
      await doc.ref.delete();
    }
  }

  async function loadCloudSnapshot(docId){
    const ref=await ensureCloudReady();
    const doc=ref.doc(docId);
    const manifest=await doc.get();
    if(!manifest.exists)throw new Error('Esa copia ya no existe.');
    const meta=manifest.data()||{};
    if(meta.format!==BACKUP_FORMAT||meta.environment!=='production')throw new Error('La copia remota no es válida.');
    const chunks=await doc.collection('chunks').orderBy('index').get();
    if(!chunks.size)throw new Error('La copia remota está incompleta.');
    const serialized=chunks.docs.map(chunk=>String(chunk.data()?.data||'')).join('');
    return validateBackup(JSON.parse(serialized));
  }

  async function listCloudSnapshots(){
    const list=byId('homebaseCloudList');
    if(!list)return;
    list.innerHTML='<div class="hb-restore-meta">Buscando versiones…</div>';
    try{
      const ref=await ensureCloudReady();
      const snap=await ref.orderBy('createdAt','desc').limit(CLOUD_KEEP).get();
      cloudRows=snap.docs.map(doc=>({id:doc.id,...doc.data()}));
      if(!cloudRows.length){
        list.innerHTML='<div class="hb-restore-meta">Todavía no hay copias automáticas. Se crearán cuando haya cambios.</div>';
        return;
      }
      list.innerHTML=cloudRows.map(row=>{
        const s=row.summary||{};
        const label=new Date(Number(row.createdAt)||0).toLocaleString('es-ES');
        const reason=row.reason==='pre-restore'?'Antes de restaurar':row.reason==='manual'?'Guardada manualmente':'Automática';
        return `<button type="button" class="hb-cloud-row" data-cloud-restore="${escapeHtml(row.id)}"><span><strong>${escapeHtml(label)}</strong><small>${reason} · ${Number(s.events||0)} eventos · ${Number(s.tasks||0)} pendientes · ${Number(s.expiries||0)} vencimientos</small></span><b>›</b></button>`;
      }).join('');
      list.querySelectorAll('[data-cloud-restore]').forEach(button=>button.onclick=()=>previewCloudRestore(button.dataset.cloudRestore));
    }catch(error){
      console.error('Homebase cloud backup list',error);
      list.innerHTML=`<div class="hb-restore-meta">No se pudo leer el historial: ${escapeHtml(error?.message||error)}</div>`;
    }
  }

  function renderDataPreview(data,title,onConfirm){
    const preview=byId('homebaseRestorePreview');
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
      <div class="hb-restore-warning">Antes de restaurar, Homebase guardará automáticamente otra versión del estado actual. La restauración actualizará este dispositivo y la copia familiar de Firebase sin cambiar tu código de sincronización.</div>
      <button type="button" class="hb-restore-confirm" id="homebaseRestoreConfirm">Restaurar esta versión</button>`;
    byId('homebaseRestoreConfirm').onclick=onConfirm;
  }

  async function previewCloudRestore(docId){
    const preview=byId('homebaseRestorePreview');
    preview.hidden=false;
    preview.innerHTML='<strong>Cargando versión…</strong><div class="hb-restore-meta">Leyendo la copia segura de Firebase.</div>';
    try{
      const data=await loadCloudSnapshot(docId);
      renderDataPreview(data,'Versión lista para restaurar',()=>restoreBackup(data));
    }catch(error){
      preview.innerHTML=`<strong>No se pudo abrir</strong><div class="hb-restore-meta">${escapeHtml(error?.message||error)}</div>`;
    }
  }

  function currentOrBackup(storage,key,fallback){
    if(Object.prototype.hasOwnProperty.call(storage,key)&&storage[key]!==undefined)return storage[key];
    const current=localStorage.getItem(key);
    return current===null?fallback:current;
  }

  async function buildAuthoritativeRestore(data){
    const storage=data.localStorage||{};
    const ref=familyRef();
    if(!ref)throw new Error('La sincronización familiar no está vinculada.');
    const remoteSnap=await ref.get();
    const remote=remoteSnap.exists?(remoteSnap.data()||{}):{};
    const now=Date.now();

    const rawItems=currentOrBackup(storage,'homebase_v2_items','[]');
    const targetItems=parseJsonValue({homebase_v2_items:rawItems},'homebase_v2_items',[]);
    const restoredIds=new Set(targetItems.map(item=>String(item?.id||'')).filter(Boolean));
    const authoritativeItems=targetItems.map(item=>({...item,updatedAt:now}));
    for(const item of Array.isArray(remote.items)?remote.items:[]){
      const id=String(item?.id||'');
      if(id&&!restoredIds.has(id))authoritativeItems.push({...item,deletedAt:now,updatedAt:now});
    }

    const rawProfiles=currentOrBackup(storage,'homebase_profiles','[]');
    const profiles=parseJsonValue({homebase_profiles:rawProfiles},'homebase_profiles',[]);
    const rawPhotos=currentOrBackup(storage,'homebase_profile_photos','{}');
    const photos=parseJsonValue({homebase_profile_photos:rawPhotos},'homebase_profile_photos',{});
    const rawRoster=currentOrBackup(storage,'homebase_roster_meta','null');
    const rosterMeta=parseJsonValue({homebase_roster_meta:rawRoster},'homebase_roster_meta',null);
    const rawExpiries=currentOrBackup(storage,'homebase_expiries_v1','[]');
    const expiries=parseJsonValue({homebase_expiries_v1:rawExpiries},'homebase_expiries_v1',[]).map(expiry=>({...expiry,updatedAt:now}));

    return {
      now,
      payload:{
        version:2,
        items:authoritativeItems,
        rosterMeta,
        profiles,
        profilesUpdatedAt:now,
        profilePhotos:photos&&typeof photos==='object'?photos:{},
        expiries,
        expiriesVersion:2,
        expiriesUpdatedAt:now,
        updatedAt:now
      },
      local:{
        homebase_v2_items:JSON.stringify(authoritativeItems),
        homebase_profiles:JSON.stringify(profiles),
        homebase_profiles_updated_at:String(now),
        homebase_profile_photos:JSON.stringify(photos&&typeof photos==='object'?photos:{}),
        homebase_roster_meta:JSON.stringify(rosterMeta),
        homebase_expiries_v1:JSON.stringify(expiries),
        homebase_expiries_updated_at:String(now),
        homebase_roster_visible:currentOrBackup(storage,'homebase_roster_visible',localStorage.getItem('homebase_roster_visible')),
        homebase_roster_settings:currentOrBackup(storage,'homebase_roster_settings',localStorage.getItem('homebase_roster_settings'))
      }
    };
  }

  function suspendLiveSync(){
    try{
      if(typeof state!=='undefined'&&state?.syncUnsubscribe){state.syncUnsubscribe();state.syncUnsubscribe=null;}
    }catch{}
    try{window.HOMEBASE_EXPIRY_SYNC?.suspend?.()}catch{}
  }

  function resumeLiveSync(){
    try{window.HOMEBASE_EXPIRY_SYNC?.resume?.()}catch{}
    try{if(typeof startCloudListener==='function')startCloudListener()}catch{}
  }

  async function restoreBackup(data){
    if(!confirm('¿Restaurar esta versión de Homebase? Se guardará primero una copia del estado actual.'))return;
    let suspended=false;
    try{
      cloudStatus('Protegiendo el estado actual antes de restaurar…');
      const protectedCopy=await createCloudSnapshot({force:true,reason:'pre-restore'});
      if(!protectedCopy)throw new Error('No se pudo crear la copia previa. Restauración cancelada.');

      suspendLiveSync();
      suspended=true;
      const restore=await buildAuthoritativeRestore(data);
      const ref=familyRef();
      await ref.set(restore.payload,{merge:true});

      for(const key of RESTORE_DATA_KEYS){
        if(Object.prototype.hasOwnProperty.call(restore.local,key)){
          const value=restore.local[key];
          if(value===null||value===undefined)localStorage.removeItem(key);
          else localStorage.setItem(key,String(value));
        }
      }
      localStorage.removeItem(LAST_HASH_KEY);
      localStorage.setItem(LAST_AT_KEY,String(Date.now()));
      location.reload();
    }catch(error){
      console.error('Homebase restore',error);
      if(suspended)resumeLiveSync();
      alert(error?.message||'No se pudo completar la restauración. Tus datos actuales no se han sustituido de forma intencionada.');
    }
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
    window.addEventListener('homebase:expiries-updated',queueAutoSnapshot);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueAutoSnapshot()});
    window.addEventListener('online',queueAutoSnapshot);
    window.addEventListener('focus',queueAutoSnapshot);
    setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)createCloudSnapshot({reason:'automatic'})},60000);
  }

  function downloadManualBackup(){
    try{
      const data=snapshot();
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;
      link.download=`homebase-backup-${new Date().toISOString().slice(0,10)}.json`;
      link.hidden=true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){
      console.error('Homebase manual backup',error);
      alert('No se pudo generar la copia manual.');
    }
  }

  function addBackupCard(){
    if(byId('homebaseBackupCard'))return;
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(page=>/Sincronización familiar/i.test(page.textContent||''))||pages.at(-1);
    if(!target)return;
    installStyles();

    const card=document.createElement('section');
    card.id='homebaseBackupCard';
    card.className='section card';
    card.style.cssText='padding:0;overflow:hidden';
    card.innerHTML=`
      <button type="button" id="homebaseBackupToggle" aria-expanded="false" style="width:100%;min-height:72px;padding:14px 16px;border:0;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:space-between;text-align:left">
        <span><strong style="display:block;font-size:17px">Copia de seguridad</strong><span style="display:block;margin-top:3px;color:var(--muted);font-size:12px">Automática y recuperable desde Firebase</span></span>
        <span aria-hidden="true" style="font-size:20px;color:var(--muted);transition:transform .2s">⌄</span>
      </button>
      <div id="homebaseBackupBody" class="hb-backup-body" hidden>
        <p class="hb-backup-copy">Homebase guarda versiones automáticamente cuando detecta cambios y conserva hasta ${CLOUD_KEEP}. También puedes guardar una versión en cualquier momento.</p>
        <div class="hb-cloud-status"><strong>Backup automático</strong><div id="homebaseCloudStatusText" class="hb-restore-meta">Preparando protección automática…</div></div>
        <div class="hb-backup-actions" style="margin-top:10px">
          <button type="button" id="homebaseCloudRefresh" class="hb-backup-secondary" aria-expanded="false">Ver versiones guardadas</button>
          <button type="button" id="homebaseCloudNow" class="hb-backup-secondary">Guardar una versión ahora</button>
        </div>
        <div id="homebaseCloudList" class="hb-cloud-list" hidden></div>
        <details style="margin-top:12px"><summary style="font-size:12px;color:var(--muted);cursor:pointer">Opciones manuales de emergencia</summary><div class="hb-backup-actions" style="margin-top:9px"><button type="button" id="homebaseBackupButton" class="hb-backup-secondary">Descargar copia manual</button><button type="button" id="homebaseRestoreButton" class="hb-backup-secondary">Restaurar copia manual</button></div><input type="file" id="homebaseRestoreInput" accept="application/json,.json" hidden></details>
        <div id="homebaseRestorePreview" class="hb-restore-preview" hidden></div>
      </div>`;
    target.appendChild(card);

    const toggle=byId('homebaseBackupToggle');
    const body=byId('homebaseBackupBody');
    const chevron=toggle.lastElementChild;
    toggle.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      const opening=body.hidden;body.hidden=!opening;toggle.setAttribute('aria-expanded',String(opening));chevron.style.transform=opening?'rotate(180deg)':'';
    },true);

    const versionsButton=byId('homebaseCloudRefresh');
    const versionsList=byId('homebaseCloudList');
    versionsButton.onclick=async()=>{
      const opening=versionsList.hidden;
      versionsList.hidden=!opening;
      versionsButton.setAttribute('aria-expanded',String(opening));
      versionsButton.textContent=opening?'Ocultar versiones':'Ver versiones guardadas';
      if(opening)await listCloudSnapshots();
    };

    byId('homebaseCloudNow').onclick=async()=>{
      cloudStatus('Guardando versión…');
      await createCloudSnapshot({force:true,reason:'manual'});
      versionsList.hidden=false;
      versionsButton.setAttribute('aria-expanded','true');
      versionsButton.textContent='Ocultar versiones';
      await listCloudSnapshots();
    };

    byId('homebaseBackupButton').onclick=downloadManualBackup;
    const restoreInput=byId('homebaseRestoreInput');
    byId('homebaseRestoreButton').onclick=()=>restoreInput.click();
    restoreInput.onchange=async()=>{
      const file=restoreInput.files?.[0];restoreInput.value='';if(!file)return;
      try{
        if(file.size>20*1024*1024)throw new Error('La copia supera 20 MB.');
        const data=validateBackup(JSON.parse(await file.text()));
        renderDataPreview(data,'Copia manual lista para restaurar',()=>restoreBackup(data));
      }catch(error){alert(error?.message||'No se pudo leer esta copia.')}
    };
  }

  function init(){
    addBackupCard();
    hookChanges();
    setTimeout(async()=>{
      if(!syncCode()){cloudStatus('Activa la sincronización familiar para guardar copias remotas.');return}
      await createCloudSnapshot({reason:'automatic'});
      const lastAt=Number(localStorage.getItem(LAST_AT_KEY)||0);
      if(lastAt)cloudStatus(`Protección automática activa · última copia ${new Date(lastAt).toLocaleString('es-ES')}`);
    },8000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
