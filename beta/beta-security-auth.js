(()=>{
'use strict';

const VERSION='6';
const FIREBASE_PROJECT='homebase-85f2b';
const INVITE_COLLECTION='homebaseDeviceInvites';
const INVITE_TTL_MS=10*60*1000;
const RESTORE_PAUSE_KEY='homebase_restore_sync_paused';
let currentUid='';
let authorizedUids=[];
let authPromise=null;

function byId(id){return document.getElementById(id)}
function isRestorePaused(){return localStorage.getItem(RESTORE_PAUSE_KEY)==='1'}
function mergeUid(list,uid){const out=[];for(const value of Array.isArray(list)?list:[]){if(typeof value==='string'&&value&&!out.includes(value))out.push(value)}if(uid&&!out.includes(uid))out.push(uid);return out}
function errorText(error){const code=String(error?.code||'');if(code==='auth/operation-not-allowed')return `Firebase rechaza el acceso anónimo en el proyecto ${FIREBASE_PROJECT}.`;if(code==='auth/network-request-failed')return 'Firebase Auth no pudo conectar con la red.';if(code==='auth/unauthorized-domain')return 'Este dominio no está autorizado en Firebase Auth.';if(code==='permission-denied')return 'Firestore ha rechazado la operación de seguridad. El código puede haber caducado o este dispositivo no está autorizado.';return code?`Error de seguridad Beta: ${code}`:`Error de seguridad Beta: ${String(error?.message||error||'desconocido')}`}

function ensureStatusUi(){
 if(byId('betaSecurityStatus'))return byId('betaSecurityStatus');
 const details=document.querySelector('#syncSection .sync-details');if(!details)return null;
 const box=document.createElement('div');box.id='betaSecurityStatus';box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(111,88,201,.08);border:1px solid rgba(111,88,201,.18);font-size:12px;line-height:1.35;color:#4b416f';
 box.innerHTML='<strong>Seguridad Beta</strong><div id="betaSecurityStatusText" style="margin-top:3px">Preparando autenticación…</div><div id="betaSecurityActions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><button id="betaAuthorizeDevice" type="button" style="border:0;border-radius:10px;padding:8px 10px;background:#6f58c9;color:white;font-weight:800">Autorizar otro dispositivo</button><button id="betaJoinDevice" type="button" style="border:1px solid rgba(111,88,201,.28);border-radius:10px;padding:8px 10px;background:white;color:#5f4bb4;font-weight:800">Vincular con código temporal</button></div>';
 details.prepend(box);byId('betaAuthorizeDevice')?.addEventListener('click',createPairingInvite);byId('betaJoinDevice')?.addEventListener('click',joinWithPairingCode);refreshPairingUi();return box;
}
function refreshPairingUi(){const linked=!!state?.syncCode;const authorize=byId('betaAuthorizeDevice'),join=byId('betaJoinDevice');if(authorize)authorize.hidden=!linked;if(join)join.hidden=linked}
function setStatus(text,isError=false){ensureStatusUi();const el=byId('betaSecurityStatusText');if(!el)return;el.textContent=text;el.style.color=isError?'#b42318':'#4b416f';refreshPairingUi()}

async function ensureAnonymousAuth(){
 if(authPromise)return authPromise;
 authPromise=(async()=>{if(!window.firebase||typeof firebase.auth!=='function')throw new Error('Firebase Auth no está disponible');const auth=firebase.auth();let user=auth.currentUser;if(!user){const result=await auth.signInAnonymously();user=result.user}if(!user)throw new Error('No se pudo crear la sesión anónima');currentUid=user.uid;window.HOMEBASE_AUTH_UID=currentUid;return user})();
 try{return await authPromise}catch(error){authPromise=null;throw error}
}
async function loadMembership(){if(!currentUid||!state?.syncCode||typeof syncDoc!=='function'){authorizedUids=mergeUid([],currentUid);return}const snap=await syncDoc().get();authorizedUids=snap.exists?mergeUid((snap.data()||{}).authorizedUids,currentUid):mergeUid([],currentUid)}
async function enrollCurrentDevice(){if(!currentUid||!state?.syncCode||typeof syncDoc!=='function')return;const FieldValue=firebase.firestore.FieldValue;await syncDoc().set({authorizedUids:FieldValue.arrayUnion(currentUid),securityVersion:2,securityUpdatedAt:Date.now()},{merge:true});authorizedUids=mergeUid(authorizedUids,currentUid)}

function randomToken(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('')}
function formatToken(token){return String(token||'').replace(/(.{4})/g,'$1-').replace(/-$/,'')}
function cleanToken(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20)}
function betaHomeId(){return state?.syncCode?`BETA_${state.syncCode}`:''}

async function createPairingInvite(){
 try{await ensureAnonymousAuth();if(!cloudDb||!state?.syncCode)throw new Error('Este dispositivo todavía no está vinculado a un hogar Beta');const token=randomToken(),now=Date.now();await cloudDb.collection(INVITE_COLLECTION).doc(token).set({homeId:betaHomeId(),createdByUid:currentUid,createdAt:firebase.firestore.Timestamp.fromMillis(now),expiresAt:firebase.firestore.Timestamp.fromMillis(now+INVITE_TTL_MS),claimedUid:null,securityVersion:2});const shown=formatToken(token);setStatus(`Código temporal creado. Caduca en 10 minutos: ${shown}`);try{await navigator.clipboard.writeText(shown);alert(`Código temporal copiado.\n\n${shown}`)}catch{prompt('Copia este código temporal. Caduca en 10 minutos.',shown)}}catch(error){console.error('Beta pairing invite',error);setStatus(errorText(error),true)}}

async function joinWithPairingCode(){
 const token=cleanToken(prompt('Introduce el código temporal generado desde un dispositivo ya autorizado.'));if(!token)return;if(token.length!==20){setStatus('El código temporal no tiene el formato esperado.',true);return}
 try{await ensureAnonymousAuth();if(!cloudDb)throw new Error('Firestore no está disponible');setStatus('Comprobando código temporal…');const inviteRef=cloudDb.collection(INVITE_COLLECTION).doc(token),inviteSnap=await inviteRef.get();if(!inviteSnap.exists)throw new Error('Código temporal no válido o ya eliminado');const invite=inviteSnap.data()||{};if(!invite.homeId||!String(invite.homeId).startsWith('BETA_'))throw new Error('Invitación Beta inválida');if(invite.claimedUid&&invite.claimedUid!==currentUid)throw new Error('Este código temporal ya ha sido utilizado');await inviteRef.update({claimedUid:currentUid,claimedAt:firebase.firestore.Timestamp.now()});const FieldValue=firebase.firestore.FieldValue,homeRef=cloudDb.collection('homebaseSyncs').doc(invite.homeId);await homeRef.set({authorizedUids:FieldValue.arrayUnion(currentUid),securityJoinToken:token,securityVersion:2,securityUpdatedAt:Date.now()},{merge:true});state.syncCode=String(invite.homeId).slice('BETA_'.length);localStorage.setItem('homebase_sync_code',state.syncCode);localStorage.removeItem(RESTORE_PAUSE_KEY);authorizedUids=mergeUid([],currentUid);const snap=await homeRef.get();if(snap.exists&&typeof applyRemotePayload==='function'){state.applyingRemote=true;applyRemotePayload(snap.data()||{});localStorage.setItem('homebase_v2_items',JSON.stringify(state.items));localStorage.setItem('homebase_roster_meta',JSON.stringify(state.rosterMeta));localStorage.setItem('homebase_profile_photos',JSON.stringify(profilePhotos));state.applyingRemote=false}try{await homeRef.set({securityJoinToken:FieldValue.delete()},{merge:true})}catch{}try{await inviteRef.delete()}catch{}if(typeof startCloudListener==='function')startCloudListener();if(typeof render==='function')render();setStatus('Dispositivo autorizado y vinculado correctamente en Beta.')}catch(error){console.error('Beta pairing join',error);setStatus(errorText(error),true)}}

function bindProtectedActions(){
 const createBtn=byId('createSyncCode'),linkBtn=byId('linkSyncCode'),syncNowBtn=byId('syncNow');
 if(createBtn&&typeof createFamilySync==='function'){const original=createFamilySync;createBtn.onclick=async()=>{try{localStorage.removeItem(RESTORE_PAUSE_KEY);await ensureAnonymousAuth();authorizedUids=mergeUid([],currentUid);await original();await enrollCurrentDevice();setStatus('Autenticación activa · este dispositivo está autorizado en Beta.')}catch(error){console.error('Beta secure create',error);setStatus(errorText(error),true)}}}
 if(linkBtn&&typeof linkFamilySync==='function'){const original=linkFamilySync;linkBtn.onclick=async()=>{try{localStorage.removeItem(RESTORE_PAUSE_KEY);await ensureAnonymousAuth();await original();await loadMembership();await enrollCurrentDevice();setStatus('Autenticación activa · dispositivo vinculado y autorizado en Beta.')}catch(error){console.error('Beta secure link',error);setStatus('No se pudo vincular con el código familiar. Usa “Vincular con código temporal”.',true)}}}
 if(syncNowBtn&&typeof refreshFromCloud==='function'&&typeof writeCloud==='function'){syncNowBtn.onclick=async()=>{if(isRestorePaused()){setStatus('Sincronización pausada tras una restauración. Reactívala desde Copia de seguridad.',true);return}try{await ensureAnonymousAuth();await refreshFromCloud(true);await writeCloud()}catch(error){console.error('Beta secure sync',error);setStatus(errorText(error),true)}}}
}

async function start(){
 ensureStatusUi();bindProtectedActions();
 try{await ensureAnonymousAuth();if(state?.syncCode&&isRestorePaused()){authorizedUids=mergeUid([],currentUid);if(state.syncUnsubscribe){try{state.syncUnsubscribe()}catch{}state.syncUnsubscribe=null}setStatus('Autenticación activa · sincronización pausada tras restauración. El código familiar sigue guardado.');return}setStatus('Autenticación anónima activa. Preparando autorización del dispositivo…');if(state?.syncCode){await loadMembership();await enrollCurrentDevice();if(typeof startCloudListener==='function')startCloudListener();if(typeof refreshWhenActive==='function')refreshWhenActive();setStatus('Autenticación activa · este dispositivo está autorizado en Beta.')}else{authorizedUids=mergeUid([],currentUid);setStatus('Autenticación activa · crea un hogar Beta o vincula este dispositivo con un código temporal.')}}catch(error){console.error('Beta security auth',error);setStatus(errorText(error),true)}}

window.HOMEBASE_BETA_SECURITY={version:VERSION,getUid:()=>currentUid,getAuthorizedUids:()=>[...authorizedUids],ensureAuth:ensureAnonymousAuth,enroll:enrollCurrentDevice,isRestorePaused};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();