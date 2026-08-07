(()=>{
  'use strict';

  const VERSION='2';
  const INVITE_COLLECTION='homebaseDeviceInvites';
  const INVITE_TTL_MS=10*60*1000;
  let currentUid='';
  let authPromise=null;
  let authorizedUids=[];
  let payloadPatched=false;

  function byId(id){return document.getElementById(id)}
  function mergeUid(list,uid){
    const out=[];
    for(const value of Array.isArray(list)?list:[]){
      if(typeof value==='string'&&value&&!out.includes(value))out.push(value);
    }
    if(uid&&!out.includes(uid))out.push(uid);
    return out;
  }

  function randomToken(){
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes=new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
  }
  function formatToken(token){return String(token||'').replace(/(.{4})/g,'$1-').replace(/-$/,'')}
  function cleanToken(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20)}
  function syncCode(){return String(localStorage.getItem('homebase_sync_code')||'').trim()}
  function store(){try{return firebase.firestore()}catch{return null}}
  function homeRef(code=syncCode()){const db=store();return code&&db?db.collection('homebaseSyncs').doc(code):null}

  function ensureSecurityUi(){
    if(byId('homebaseSecurityBox'))return byId('homebaseSecurityBox');
    const details=document.querySelector('#syncSection .sync-details');
    if(!details)return null;
    const box=document.createElement('div');
    box.id='homebaseSecurityBox';
    box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(47,158,116,.08);border:1px solid rgba(47,158,116,.18);font-size:12px;line-height:1.4;color:var(--text)';
    box.innerHTML=`<strong>Dispositivos del hogar</strong><div id="homebaseSecurityText" style="margin-top:3px;color:var(--muted)">Preparando acceso seguro…</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><button id="homebaseAuthorizeDevice" type="button" style="border:0;border-radius:10px;padding:8px 10px;background:var(--accent);color:#fff;font-weight:800">Autorizar otro dispositivo</button><button id="homebaseJoinDevice" type="button" style="border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--surface);color:var(--text);font-weight:800">Vincular con código temporal</button></div>`;
    details.prepend(box);
    byId('homebaseAuthorizeDevice')?.addEventListener('click',createPairingInvite);
    byId('homebaseJoinDevice')?.addEventListener('click',joinWithPairingCode);
    refreshSecurityUi();
    return box;
  }

  function refreshSecurityUi(){
    const linked=!!syncCode();
    const authorize=byId('homebaseAuthorizeDevice');
    const join=byId('homebaseJoinDevice');
    if(authorize)authorize.hidden=!linked;
    if(join)join.hidden=linked;
  }

  function setSecurityText(text,isError=false){
    ensureSecurityUi();
    const el=byId('homebaseSecurityText');
    if(el){el.textContent=text;el.style.color=isError?'#b42318':'var(--muted)'}
    refreshSecurityUi();
  }

  async function ensureAuth(){
    if(authPromise)return authPromise;
    authPromise=(async()=>{
      if(!window.firebase||typeof firebase.auth!=='function')throw new Error('Firebase Auth no está disponible');
      const auth=firebase.auth();
      let user=auth.currentUser;
      if(!user){const result=await auth.signInAnonymously();user=result.user;}
      if(!user)throw new Error('No se pudo iniciar la sesión segura');
      currentUid=user.uid;
      window.HOMEBASE_AUTH_UID=currentUid;
      patchCloudPayload();
      return user;
    })();
    try{return await authPromise}catch(error){authPromise=null;throw error}
  }

  function patchCloudPayload(){
    if(payloadPatched||typeof cloudPayload!=='function')return;
    const original=cloudPayload;
    cloudPayload=function(){
      const payload=original();
      if(currentUid){payload.authorizedUids=mergeUid(authorizedUids,currentUid);payload.securityVersion=2;}
      return payload;
    };
    payloadPatched=true;
  }

  async function loadMembership(){
    const ref=homeRef();
    if(!ref||!currentUid){authorizedUids=mergeUid([],currentUid);return;}
    const snap=await ref.get();
    authorizedUids=snap.exists?mergeUid((snap.data()||{}).authorizedUids,currentUid):mergeUid([],currentUid);
  }

  async function enrollCurrentDevice(){
    const ref=homeRef();
    if(!ref||!currentUid)return;
    try{
      const snap=await ref.get();
      if(snap.exists)authorizedUids=mergeUid((snap.data()||{}).authorizedUids,currentUid);
      else authorizedUids=mergeUid([],currentUid);
      await ref.set({
        authorizedUids:firebase.firestore.FieldValue.arrayUnion(currentUid),
        securityVersion:2,
        securityUpdatedAt:Date.now()
      },{merge:true});
      authorizedUids=mergeUid(authorizedUids,currentUid);
    }catch(error){
      console.warn('Homebase production auth enrollment',error);
      throw error;
    }
  }

  async function createPairingInvite(){
    try{
      await ensureAuth();
      const code=syncCode(),db=store();
      if(!code||!db)throw new Error('Este dispositivo no está vinculado a un hogar');
      await loadMembership();
      const token=randomToken(),now=Date.now();
      await db.collection(INVITE_COLLECTION).doc(token).set({
        homeId:code,
        createdByUid:currentUid,
        createdAt:firebase.firestore.Timestamp.fromMillis(now),
        expiresAt:firebase.firestore.Timestamp.fromMillis(now+INVITE_TTL_MS),
        claimedUid:null,
        securityVersion:2
      });
      const shown=formatToken(token);
      setSecurityText(`Código temporal creado. Caduca en 10 minutos: ${shown}`);
      try{
        await navigator.clipboard.writeText(shown);
        alert(`Código temporal copiado.\n\n${shown}\n\nEn el dispositivo nuevo: Homebase → Más → Sincronización familiar → Vincular con código temporal.`);
      }catch{
        prompt('Copia este código temporal. Caduca en 10 minutos.',shown);
      }
    }catch(error){
      console.error('Homebase pairing invite',error);
      setSecurityText(`No se pudo crear el código temporal: ${String(error?.message||error)}`,true);
    }
  }

  async function joinWithPairingCode(){
    const token=cleanToken(prompt('Introduce el código temporal generado desde un dispositivo ya autorizado.'));
    if(!token)return;
    if(token.length!==20){setSecurityText('El código temporal no tiene el formato esperado.',true);return;}
    try{
      await ensureAuth();
      const db=store();
      if(!db)throw new Error('Firestore no está disponible');
      setSecurityText('Comprobando código temporal…');
      const inviteRef=db.collection(INVITE_COLLECTION).doc(token);
      const inviteSnap=await inviteRef.get();
      if(!inviteSnap.exists)throw new Error('Código temporal no válido o ya eliminado');
      const invite=inviteSnap.data()||{};
      const expiresMs=invite.expiresAt?.toMillis?.()||0;
      if(!invite.homeId||String(invite.homeId).startsWith('BETA_'))throw new Error('Invitación de producción inválida');
      if(!expiresMs||expiresMs<Date.now())throw new Error('El código temporal ha caducado');
      if(invite.claimedUid&&invite.claimedUid!==currentUid)throw new Error('Este código temporal ya ha sido utilizado');

      await inviteRef.update({claimedUid:currentUid,claimedAt:firebase.firestore.Timestamp.now()});
      const FieldValue=firebase.firestore.FieldValue;
      const ref=homeRef(String(invite.homeId));
      await ref.set({
        authorizedUids:FieldValue.arrayUnion(currentUid),
        securityJoinToken:token,
        securityVersion:2,
        securityUpdatedAt:Date.now()
      },{merge:true});

      const code=String(invite.homeId);
      if(typeof state!=='undefined')state.syncCode=code;
      localStorage.setItem('homebase_sync_code',code);
      authorizedUids=mergeUid([],currentUid);
      patchCloudPayload();

      const snap=await ref.get();
      if(snap.exists&&typeof applyRemotePayload==='function'){
        if(typeof state!=='undefined')state.applyingRemote=true;
        applyRemotePayload(snap.data()||{});
        if(typeof state!=='undefined'){
          localStorage.setItem('homebase_v2_items',JSON.stringify(state.items));
          localStorage.setItem('homebase_roster_meta',JSON.stringify(state.rosterMeta));
        }
        if(typeof profilePhotos!=='undefined')localStorage.setItem('homebase_profile_photos',JSON.stringify(profilePhotos));
        if(typeof state!=='undefined')state.applyingRemote=false;
      }

      try{await ref.set({securityJoinToken:FieldValue.delete()},{merge:true})}catch{}
      try{await inviteRef.delete()}catch{}
      if(typeof startCloudListener==='function')startCloudListener();
      if(typeof render==='function')render();
      setSecurityText('Dispositivo autorizado y vinculado correctamente.');
      window.dispatchEvent(new CustomEvent('homebase:auth-ready',{detail:{uid:currentUid}}));
    }catch(error){
      console.error('Homebase pairing join',error);
      setSecurityText(`No se pudo vincular el dispositivo: ${String(error?.message||error)}`,true);
    }
  }

  async function start(){
    ensureSecurityUi();
    try{
      await ensureAuth();
      if(syncCode()){
        await enrollCurrentDevice();
        setSecurityText('Este dispositivo está autorizado para este hogar.');
      }else{
        authorizedUids=mergeUid([],currentUid);
        setSecurityText('Acceso seguro preparado. Para unirte a un hogar usa un código temporal.');
      }
      window.dispatchEvent(new CustomEvent('homebase:auth-ready',{detail:{uid:currentUid}}));
    }catch(error){
      console.error('Homebase production auth',error);
      setSecurityText(`No se pudo preparar el acceso seguro: ${String(error?.message||error)}`,true);
      window.dispatchEvent(new CustomEvent('homebase:auth-error',{detail:{message:String(error?.message||error)}}));
    }
  }

  window.HOMEBASE_SECURITY={
    version:VERSION,
    ensureAuth,
    enroll:async()=>{await ensureAuth();return enrollCurrentDevice()},
    createPairingInvite,
    joinWithPairingCode,
    getUid:()=>currentUid,
    getAuthorizedUids:()=>[...authorizedUids]
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
