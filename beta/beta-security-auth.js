(()=>{
'use strict';

const VERSION='2';
const FIREBASE_PROJECT='homebase-85f2b';
let currentUid='';
let authorizedUids=[];
let authPromise=null;
let payloadPatched=false;

function byId(id){return document.getElementById(id)}

function ensureStatusUi(){
  if(byId('betaSecurityStatus')) return byId('betaSecurityStatus');
  const details=document.querySelector('#syncSection .sync-details');
  if(!details) return null;
  const box=document.createElement('div');
  box.id='betaSecurityStatus';
  box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(111,88,201,.08);border:1px solid rgba(111,88,201,.18);font-size:12px;line-height:1.35;color:#4b416f';
  box.innerHTML='<strong>Seguridad Beta</strong><div id="betaSecurityStatusText" style="margin-top:3px">Preparando autenticación…</div>';
  details.prepend(box);
  return box;
}

function setStatus(text,isError=false){
  ensureStatusUi();
  const el=byId('betaSecurityStatusText');
  if(!el) return;
  el.textContent=text;
  el.style.color=isError?'#b42318':'#4b416f';
}

function errorText(error){
  const code=String(error?.code||'');
  if(code==='auth/operation-not-allowed') return `Firebase rechaza el acceso anónimo en el proyecto ${FIREBASE_PROJECT}. Comprueba que Anónimo esté habilitado en ese proyecto.`;
  if(code==='auth/network-request-failed') return 'Firebase Auth no pudo conectar con la red. Comprueba la conexión e inténtalo de nuevo.';
  if(code==='auth/unauthorized-domain') return 'Este dominio no está autorizado en Firebase Auth.';
  if(code) return `Error de seguridad Beta: ${code}`;
  return `Error de seguridad Beta: ${String(error?.message||error||'desconocido')}`;
}

function mergeUid(list,uid){
  const out=[];
  for(const value of Array.isArray(list)?list:[]){
    if(typeof value==='string'&&value&&!out.includes(value)) out.push(value);
  }
  if(uid&&!out.includes(uid)) out.push(uid);
  return out;
}

function patchCloudPayload(){
  if(payloadPatched||typeof cloudPayload!=='function') return;
  const original=cloudPayload;
  cloudPayload=function(){
    const payload=original();
    if(currentUid){
      payload.authorizedUids=mergeUid(authorizedUids,currentUid);
      payload.securityVersion=1;
    }
    return payload;
  };
  payloadPatched=true;
}

async function ensureAnonymousAuth(){
  if(authPromise) return authPromise;
  authPromise=(async()=>{
    if(!window.firebase||typeof firebase.auth!=='function') throw new Error('Firebase Auth no está disponible');
    const auth=firebase.auth();
    let user=auth.currentUser;
    if(!user){
      const result=await auth.signInAnonymously();
      user=result.user;
    }
    if(!user) throw new Error('No se pudo crear la sesión anónima');
    currentUid=user.uid;
    window.HOMEBASE_AUTH_UID=currentUid;
    patchCloudPayload();
    return user;
  })();
  try{return await authPromise}catch(error){authPromise=null;throw error}
}

async function loadMembership(){
  if(!currentUid||!state?.syncCode||typeof syncDoc!=='function'){
    authorizedUids=mergeUid([],currentUid);
    return;
  }
  try{
    const snap=await syncDoc().get();
    if(snap.exists){
      const data=snap.data()||{};
      authorizedUids=mergeUid(data.authorizedUids,currentUid);
    }else{
      authorizedUids=mergeUid([],currentUid);
    }
  }catch(error){
    authorizedUids=mergeUid([],currentUid);
    throw error;
  }
}

async function enrollCurrentDevice(){
  if(!currentUid||!state?.syncCode||typeof syncDoc!=='function') return;
  const ref=syncDoc();
  const FieldValue=firebase.firestore.FieldValue;
  await ref.set({
    authorizedUids:FieldValue.arrayUnion(currentUid),
    securityVersion:1,
    securityUpdatedAt:Date.now()
  },{merge:true});
  authorizedUids=mergeUid(authorizedUids,currentUid);
}

function bindProtectedActions(){
  const createBtn=byId('createSyncCode');
  const linkBtn=byId('linkSyncCode');
  const syncNowBtn=byId('syncNow');

  if(createBtn&&typeof createFamilySync==='function'){
    const original=createFamilySync;
    createBtn.onclick=async()=>{
      try{
        await ensureAnonymousAuth();
        authorizedUids=mergeUid([],currentUid);
        patchCloudPayload();
        await original();
        await enrollCurrentDevice();
        setStatus('Autenticación activa · este dispositivo está autorizado en Beta.');
      }catch(error){
        console.error('Beta secure create',error);
        setStatus(errorText(error),true);
      }
    };
  }

  if(linkBtn&&typeof linkFamilySync==='function'){
    const original=linkFamilySync;
    linkBtn.onclick=async()=>{
      try{
        await ensureAnonymousAuth();
        await original();
        await loadMembership();
        await enrollCurrentDevice();
        patchCloudPayload();
        setStatus('Autenticación activa · dispositivo vinculado y autorizado en Beta.');
      }catch(error){
        console.error('Beta secure link',error);
        setStatus(errorText(error),true);
      }
    };
  }

  if(syncNowBtn&&typeof refreshFromCloud==='function'&&typeof writeCloud==='function'){
    syncNowBtn.onclick=async()=>{
      try{
        await ensureAnonymousAuth();
        await refreshFromCloud(true);
        await writeCloud();
      }catch(error){
        console.error('Beta secure sync',error);
        setStatus(errorText(error),true);
      }
    };
  }
}

async function start(){
  ensureStatusUi();
  bindProtectedActions();
  try{
    await ensureAnonymousAuth();
    setStatus('Autenticación anónima activa. Preparando autorización del dispositivo…');
    if(state?.syncCode){
      await loadMembership();
      await enrollCurrentDevice();
      if(typeof startCloudListener==='function') startCloudListener();
      if(typeof refreshWhenActive==='function') refreshWhenActive();
      setStatus('Autenticación activa · este dispositivo está autorizado en Beta.');
    }else{
      authorizedUids=mergeUid([],currentUid);
      setStatus('Autenticación activa · crea o vincula un hogar Beta para completar la autorización.');
    }
  }catch(error){
    console.error('Beta security auth',error);
    setStatus(errorText(error),true);
  }
}

window.HOMEBASE_BETA_SECURITY={version:VERSION,getUid:()=>currentUid,getAuthorizedUids:()=>[...authorizedUids],ensureAuth:ensureAnonymousAuth,enroll:enrollCurrentDevice};

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();