(()=>{
'use strict';

const VERSION='9';
const RECOVERY_KEY='homebase_firestore_queue_recovered_v1';
let currentUid='';
let authorizedUids=[];
let authPromise=null;
let persistenceReady=false;

function byId(id){return document.getElementById(id)}
function mergeUid(list,uid){const out=[];for(const value of Array.isArray(list)?list:[]){if(typeof value==='string'&&value&&!out.includes(value))out.push(value)}if(uid&&!out.includes(uid))out.push(uid);return out}
function shortUid(uid){const v=String(uid||'');return v.length>16?`${v.slice(0,7)}…${v.slice(-6)}`:v}
function errorText(error){const code=String(error?.code||'');if(code==='auth/operation-not-allowed')return 'Firebase rechaza el acceso anónimo.';if(code==='auth/network-request-failed')return 'Firebase Auth no pudo conectar con la red.';if(code==='auth/unauthorized-domain')return 'Este dominio no está autorizado en Firebase Auth.';if(code==='permission-denied')return 'Firestore ha rechazado la operación de seguridad.';return code?`Error de seguridad: ${code}`:`Error de seguridad: ${String(error?.message||error||'desconocido')}`}
function db(){return window.cloudDb||null}
function syncRef(){return db()&&state?.syncCode?db().collection('homebaseSyncs').doc(state.syncCode):null}
function timeout(promise,ms,label){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label}: timeout ${ms} ms`)),ms))])}

function ensureStatusUi(){
 if(byId('productionSecurityStatus'))return byId('productionSecurityStatus');
 const details=document.querySelector('#syncSection .sync-details');if(!details)return null;
 const box=document.createElement('div');box.id='productionSecurityStatus';box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(217,120,31,.07);border:1px solid rgba(217,120,31,.16);font-size:12px;line-height:1.35;color:#6e4a27';
 box.innerHTML='<strong>Seguridad del hogar</strong><div id="productionSecurityStatusText" style="margin-top:3px">Preparando autenticación…</div><div id="productionSecurityUid" style="margin-top:4px;color:#8a6a4b"></div>';
 details.prepend(box);return box;
}
function ensureDiagUi(){
 let box=byId('productionFirestoreDiagnostics');if(box)return box;
 const security=ensureStatusUi(),details=document.querySelector('#syncSection .sync-details');if(!details)return null;
 box=document.createElement('div');box.id='productionFirestoreDiagnostics';box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(49,94,139,.06);border:1px solid rgba(49,94,139,.15);font-size:11px;line-height:1.4;color:#334155';
 box.innerHTML='<strong>Diagnóstico Firestore</strong><div id="productionFirestoreDiagnosticsText" style="margin-top:5px;white-space:pre-wrap">Esperando Auth…</div>';
 security?.insertAdjacentElement('afterend',box);return box;
}
function setStatus(text,isError=false){ensureStatusUi();const el=byId('productionSecurityStatusText');if(!el)return;el.textContent=text;el.style.color=isError?'#b42318':'#6e4a27'}
function setUid(){const el=byId('productionSecurityUid');if(el)el.textContent=currentUid?`UID actual: ${shortUid(currentUid)}`:''}
function showDiag(lines){ensureDiagUi();const el=byId('productionFirestoreDiagnosticsText');if(el)el.textContent=lines.join('\n')}
function diagError(error){return `${error?.code||error?.name||'Error'} · ${String(error?.message||error||'').slice(0,110)}`}

async function preparePersistence(auth){if(persistenceReady)return;if(auth?.setPersistence&&firebase.auth?.Auth?.Persistence?.LOCAL)await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);persistenceReady=true}
function waitForInitialAuthState(auth,timeoutMs=1800){return new Promise(resolve=>{let done=false,unsub=null;const finish=user=>{if(done)return;done=true;clearTimeout(timer);try{unsub?.()}catch{}resolve(user||auth.currentUser||null)};const timer=setTimeout(()=>finish(auth.currentUser),timeoutMs);try{unsub=auth.onAuthStateChanged(user=>finish(user),()=>finish(auth.currentUser))}catch{finish(auth.currentUser)}})}
async function ensureAnonymousAuth(){
 const auth=firebase?.auth?.();if(!auth)throw new Error('Firebase Auth no está disponible');
 if(auth.currentUser){currentUid=auth.currentUser.uid;window.HOMEBASE_AUTH_UID=currentUid;setUid();return auth.currentUser}
 if(authPromise)return authPromise;
 authPromise=(async()=>{await preparePersistence(auth);let user=auth.currentUser;if(!user)user=await waitForInitialAuthState(auth);if(!user){const result=await auth.signInAnonymously();user=result.user}if(!user)throw new Error('No se pudo crear la sesión anónima');currentUid=user.uid;window.HOMEBASE_AUTH_UID=currentUid;setUid();return user})();
 try{return await authPromise}finally{authPromise=null}
}

async function runDiagnostics(){
 const lines=[];let pendingStuck=false;ensureDiagUi();
 const home=String(state?.syncCode||'').trim(),projectId=firebase?.app?.()?.options?.projectId||'';
 lines.push(`Auth: ${currentUid?'OK':'NO'} · UID ${currentUid?shortUid(currentUid):'?'}`);
 lines.push(`Online: ${navigator.onLine?'sí':'no'} · Proyecto: ${projectId||'?'}`);
 lines.push(`Hogar: ${home||'(sin código)'}`);showDiag(lines);
 const ref=syncRef();if(!ref){lines.push('Firestore ref: no disponible');showDiag(lines);return {pendingStuck:false}}
 try{const snap=await timeout(ref.get({source:'server'}),6000,'server');lines.push(`SDK servidor: OK · ${snap.exists?'existe':'no existe'}`)}catch(error){lines.push(`SDK servidor: ${diagError(error)}`)}showDiag(lines);
 try{await timeout(db().waitForPendingWrites(),2500,'pending');lines.push('Pending writes: ninguno')}catch(error){pendingStuck=true;lines.push('Pending writes: cola bloqueada')}
 showDiag(lines);return {pendingStuck};
}

async function recoverStuckQueue(){
 if(sessionStorage.getItem(RECOVERY_KEY)==='1')return false;
 const firestore=db();if(!firestore)return false;
 setStatus('Limpiando una cola local de sincronización bloqueada…');
 showDiag(['Cola bloqueada detectada.','Se reiniciará solo la caché local de Firestore.','Los datos de Homebase en este dispositivo no se borran.']);
 sessionStorage.setItem(RECOVERY_KEY,'1');
 try{
  if(state?.syncUnsubscribe){try{state.syncUnsubscribe()}catch{}state.syncUnsubscribe=null}
  await firestore.terminate();
  await firestore.clearPersistence();
  const url=new URL(location.href);url.searchParams.set('firestoreRecovery',Date.now());
  location.replace(url.href);
  return true;
 }catch(error){
  console.error('Firestore queue recovery',error);
  sessionStorage.removeItem(RECOVERY_KEY);
  setStatus(`No se pudo reiniciar la caché Firestore: ${String(error?.message||error)}`,true);
  return false;
 }
}

async function loadMembership(){const ref=syncRef();if(!currentUid||!ref){authorizedUids=mergeUid([],currentUid);return}const snap=await ref.get({source:'server'});authorizedUids=snap.exists?mergeUid((snap.data()||{}).authorizedUids,currentUid):mergeUid([],currentUid)}
async function enrollCurrentDevice(){const ref=syncRef();if(!currentUid||!ref)return;const FieldValue=firebase.firestore.FieldValue;await ref.set({authorizedUids:FieldValue.arrayUnion(currentUid),securityVersion:2,securityUpdatedAt:Date.now()},{merge:true});authorizedUids=mergeUid(authorizedUids,currentUid)}
function bindProtectedActions(){const syncNowBtn=byId('syncNow');if(syncNowBtn&&typeof refreshFromCloud==='function'&&typeof writeCloud==='function')syncNowBtn.onclick=async()=>{try{await ensureAnonymousAuth();await refreshFromCloud(true);await writeCloud()}catch(error){console.error('Production secure sync',error);setStatus(errorText(error),true)}}}

async function start(){
 ensureStatusUi();ensureDiagUi();bindProtectedActions();
 try{
  await ensureAnonymousAuth();
  setStatus('Autenticación anónima activa. Comprobando Firestore…');
  const diag=await runDiagnostics();
  if(diag.pendingStuck&&await recoverStuckQueue())return;
  sessionStorage.removeItem(RECOVERY_KEY);
  if(state?.syncCode){
   setStatus('Preparando autorización del dispositivo…');
   await loadMembership();
   await enrollCurrentDevice();
   if(typeof startCloudListener==='function')startCloudListener();
   if(typeof refreshWhenActive==='function')refreshWhenActive();
   setStatus('Autenticación activa · este dispositivo está autorizado.');
  }else{authorizedUids=mergeUid([],currentUid);setStatus('Autenticación activa · todavía no hay hogar vinculado.')}
  window.dispatchEvent(new CustomEvent('homebase:auth-ready',{detail:{uid:currentUid,authorized:authorizedUids.includes(currentUid)}}));
 }catch(error){console.error('Homebase production auth',error);setStatus(errorText(error),true);window.dispatchEvent(new CustomEvent('homebase:auth-error',{detail:{message:String(error?.message||error)}}))}
}
window.HOMEBASE_SECURITY={version:VERSION,getUid:()=>currentUid,getAuthorizedUids:()=>[...authorizedUids],ensureAuth:ensureAnonymousAuth,enroll:enrollCurrentDevice,runDiagnostics};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();