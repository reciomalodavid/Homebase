(()=>{
'use strict';

const VERSION='13';
const APP_VERSION='1.10.54';
const APP_BUILD=11054;
const INVITE_COLLECTION='homebaseDeviceInvites';
const INVITE_TTL_MS=10*60*1000;
const SERVER_TIMEOUT_MS=12000;
const AUTH_CACHE_PREFIX='homebase_authorized_uid_v1_';
let currentUid='';
let authorizedUids=[];
let authPromise=null;
let persistenceReady=false;
let membershipState='unknown';
let membershipRetryTimer=null;

function byId(id){return document.getElementById(id)}
function uniqueUids(list){const out=[];for(const value of Array.isArray(list)?list:[]){if(typeof value==='string'&&value&&!out.includes(value))out.push(value)}return out}
function shortUid(uid){const v=String(uid||'');return v.length>16?`${v.slice(0,7)}…${v.slice(-6)}`:v}
function errorCode(error){return String(error?.code||'')}
function isPermissionDenied(error){return errorCode(error)==='permission-denied'||/permission/i.test(String(error?.message||''))}
function isTransient(error){const code=errorCode(error);const msg=String(error?.message||'');return code==='unavailable'||code==='deadline-exceeded'||code==='network-request-failed'||/timeout|network|offline|unavailable/i.test(msg)}
function errorText(error){const code=errorCode(error);if(code==='auth/operation-not-allowed')return 'Firebase rechaza el acceso anónimo.';if(code==='auth/network-request-failed')return 'No hay conexión con Firebase Auth.';if(code==='auth/unauthorized-domain')return 'Este dominio no está autorizado en Firebase Auth.';if(isPermissionDenied(error))return 'Este dispositivo necesita volver a autorizarse.';if(isTransient(error))return 'No se ha podido confirmar la conexión. Homebase reintentará automáticamente.';return code?`Error de seguridad: ${code}`:`Error de seguridad: ${String(error?.message||error||'desconocido')}`}
function stepError(step,error){const wrapped=new Error(`${step}: ${errorText(error)}`);wrapped.code=error?.code||'';return wrapped}
function db(){return window.cloudDb||null}
function syncRef(homeId=state?.syncCode){return db()&&homeId?db().collection('homebaseSyncs').doc(String(homeId)):null}
function timeout(promise,ms,label){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error(`${label}: timeout ${ms} ms`),{code:'deadline-exceeded'})),ms)})]).finally(()=>clearTimeout(timer))}
function authCacheKey(homeId=state?.syncCode){return `${AUTH_CACHE_PREFIX}${String(homeId||'')}`}
function rememberAuthorization(){if(state?.syncCode&&currentUid)localStorage.setItem(authCacheKey(),currentUid)}
function cachedAuthorizationMatches(){return !!state?.syncCode&&!!currentUid&&localStorage.getItem(authCacheKey())===currentUid}
function clearAuthorizationCache(){if(state?.syncCode)localStorage.removeItem(authCacheKey())}

function ensureStatusUi(){
 if(byId('productionSecurityStatus'))return byId('productionSecurityStatus');
 const details=document.querySelector('#syncSection .sync-details');if(!details)return null;
 const box=document.createElement('div');box.id='productionSecurityStatus';box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(217,120,31,.07);border:1px solid rgba(217,120,31,.16);font-size:12px;line-height:1.35;color:#6e4a27';
 box.innerHTML=`<strong>Seguridad del hogar</strong><div id="productionSecurityStatusText" style="margin-top:3px">Preparando acceso…</div><div id="productionSecurityUid" style="display:none;margin-top:4px;color:#8a6a4b"></div><div id="productionAppVersion" style="margin-top:5px;color:#8a6a4b;font-weight:700">Homebase ${APP_VERSION} · build ${APP_BUILD}</div><div id="productionSecurityActions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><button id="productionAuthorizeDevice" type="button" style="border:0;border-radius:10px;padding:8px 10px;background:#d9781f;color:white;font-weight:800">Autorizar otro dispositivo</button><button id="productionJoinDevice" type="button" style="border:1px solid rgba(217,120,31,.28);border-radius:10px;padding:8px 10px;background:white;color:#a95d17;font-weight:800">Reautorizar este dispositivo</button></div>`;
 details.prepend(box);
 byId('productionAuthorizeDevice')?.addEventListener('click',createPairingInvite);
 byId('productionJoinDevice')?.addEventListener('click',joinWithPairingCode);
 refreshPairingUi();return box;
}
function refreshPairingUi(){
 const linked=!!state?.syncCode,authorize=byId('productionAuthorizeDevice'),join=byId('productionJoinDevice');
 if(authorize)authorize.hidden=!(linked&&membershipState==='authorized');
 if(join){join.hidden=linked&&membershipState!=='unauthorized';join.textContent=linked?'Reautorizar este dispositivo':'Vincular con código temporal'}
 const legacyCreate=byId('syncCreateActions'),legacyLink=byId('syncLinkRow'),legacyStatus=document.querySelector('#syncSection .sync-status');
 if(legacyCreate)legacyCreate.hidden=true;
 if(legacyLink)legacyLink.hidden=true;
 if(legacyStatus)legacyStatus.hidden=!linked;
}
function setStatus(text,kind='normal'){
 ensureStatusUi();const el=byId('productionSecurityStatusText');if(!el)return;el.textContent=text;
 const colors={normal:'#6e4a27',ok:'#2c7a56',warn:'#9a641f',error:'#b42318'};el.style.color=colors[kind]||colors.normal;
 refreshPairingUi();
}
function setUid(){const el=byId('productionSecurityUid');if(el)el.textContent=currentUid?`UID actual: ${shortUid(currentUid)}`:''}

async function preparePersistence(auth){if(persistenceReady)return;if(auth?.setPersistence&&firebase.auth?.Auth?.Persistence?.LOCAL)await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);persistenceReady=true}
function waitForInitialAuthState(auth,timeoutMs=2200){return new Promise(resolve=>{let done=false,unsub=null;const finish=user=>{if(done)return;done=true;clearTimeout(timer);try{unsub?.()}catch{}resolve(user||auth.currentUser||null)};const timer=setTimeout(()=>finish(auth.currentUser),timeoutMs);try{unsub=auth.onAuthStateChanged(user=>finish(user),()=>finish(auth.currentUser))}catch{finish(auth.currentUser)}})}
async function ensureAnonymousAuth(){
 const auth=firebase?.auth?.();if(!auth)throw new Error('Firebase Auth no está disponible');
 if(auth.currentUser){currentUid=auth.currentUser.uid;window.HOMEBASE_AUTH_UID=currentUid;setUid();return auth.currentUser}
 if(authPromise)return authPromise;
 authPromise=(async()=>{await preparePersistence(auth);let user=auth.currentUser;if(!user)user=await waitForInitialAuthState(auth);if(!user){const result=await auth.signInAnonymously();user=result.user}if(!user)throw new Error('No se pudo crear la sesión anónima');currentUid=user.uid;window.HOMEBASE_AUTH_UID=currentUid;setUid();return user})();
 try{return await authPromise}finally{authPromise=null}
}

async function readMembershipFromServer(){const ref=syncRef();if(!ref)return {exists:false,uids:[]};const snap=await timeout(ref.get({source:'server'}),SERVER_TIMEOUT_MS,'server');return {exists:snap.exists,uids:snap.exists?uniqueUids((snap.data()||{}).authorizedUids):[]}}
async function verifyMembership({quiet=false}={}){
 if(!state?.syncCode){membershipState='unknown';authorizedUids=[];refreshPairingUi();return false}
 try{
  const result=await readMembershipFromServer();authorizedUids=result.uids;const authorized=result.exists&&authorizedUids.includes(currentUid);membershipState=authorized?'authorized':'unauthorized';
  if(authorized){rememberAuthorization();if(!quiet)setStatus('Acceso seguro confirmado.','ok')}else{clearAuthorizationCache();if(!quiet)setStatus('Este dispositivo necesita volver a autorizarse.','error')}
  refreshPairingUi();return authorized;
 }catch(error){
  if(isPermissionDenied(error)){authorizedUids=[];membershipState='unauthorized';clearAuthorizationCache();if(!quiet)setStatus('Este dispositivo necesita volver a autorizarse.','error');refreshPairingUi();return false}
  if(isTransient(error)){membershipState=cachedAuthorizationMatches()?'authorized':'offline';if(!quiet)setStatus(membershipState==='authorized'?'Sin conexión. Seguimos con el estado local y reintentaremos.':'Conexión pendiente. Homebase reintentará automáticamente.','warn');refreshPairingUi();scheduleMembershipRetry();return membershipState==='authorized'}
  throw error;
 }
}
function scheduleMembershipRetry(){clearTimeout(membershipRetryTimer);membershipRetryTimer=setTimeout(async()=>{try{await ensureAnonymousAuth();await verifyMembership({quiet:false});if(membershipState==='authorized')startSecureSync()}catch(error){console.debug('Membership retry',error)}},8000)}
function startSecureSync(){if(membershipState!=='authorized')return;try{if(typeof startCloudListener==='function'&&!state?.syncUnsubscribe)startCloudListener()}catch(error){console.warn('Cloud listener start',error)}try{if(typeof refreshWhenActive==='function')refreshWhenActive()}catch(error){console.warn('Cloud refresh start',error)}}

function randomToken(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('')}
function formatToken(token){return String(token||'').replace(/(.{4})/g,'$1-').replace(/-$/,'')}
function cleanToken(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20)}
async function createPairingInvite(){
 try{setStatus('Comprobando autorización…');await ensureAnonymousAuth();if(!db()||!state?.syncCode)throw new Error('Este dispositivo todavía no está vinculado a un hogar');const ok=await verifyMembership({quiet:true});if(!ok){setStatus('Este dispositivo necesita volver a autorizarse antes de añadir otro.','error');return}const token=randomToken(),now=Date.now();await timeout(db().collection(INVITE_COLLECTION).doc(token).set({homeId:String(state.syncCode),createdByUid:currentUid,createdAt:firebase.firestore.Timestamp.fromMillis(now),expiresAt:firebase.firestore.Timestamp.fromMillis(now+INVITE_TTL_MS),claimedUid:null,securityVersion:3}),SERVER_TIMEOUT_MS,'invite');const shown=formatToken(token);setStatus('Código temporal creado. Caduca en 10 minutos.','ok');try{await navigator.clipboard.writeText(shown);alert(`Código temporal copiado.\n\n${shown}`)}catch{prompt('Copia este código temporal. Caduca en 10 minutos.',shown)}}catch(error){console.error('Production pairing invite',error);setStatus(errorText(error),isTransient(error)?'warn':'error')}
}
async function atomicClaimAndJoin(token){if(!db())throw new Error('Firestore no está disponible');const inviteRef=db().collection(INVITE_COLLECTION).doc(token);const FieldValue=firebase.firestore.FieldValue;let homeId='';try{await timeout(db().runTransaction(async tx=>{const inviteSnap=await tx.get(inviteRef);if(!inviteSnap.exists)throw new Error('Código temporal no válido o ya eliminado');const invite=inviteSnap.data()||{};if(!invite.homeId)throw new Error('Invitación inválida');const expiresMs=invite.expiresAt?.toMillis?.()||0;if(expiresMs&&expiresMs<=Date.now())throw new Error('El código temporal ha caducado');if(invite.claimedUid&&invite.claimedUid!==currentUid)throw new Error('Este código temporal ya ha sido utilizado');homeId=String(invite.homeId);const homeRef=syncRef(homeId);tx.update(inviteRef,{claimedUid:currentUid,claimedAt:firebase.firestore.Timestamp.now()});tx.set(homeRef,{authorizedUids:FieldValue.arrayUnion(currentUid),securityJoinToken:token,securityVersion:3,securityUpdatedAt:Date.now()},{merge:true})}),SERVER_TIMEOUT_MS,'join')}catch(error){throw stepError('Autorización',error)}return homeId}
async function joinWithPairingCode(){const token=cleanToken(prompt('Introduce el código temporal generado desde un dispositivo ya autorizado.'));if(!token)return;if(token.length!==20){setStatus('El código temporal no tiene el formato esperado.','error');return}try{setStatus('Autenticando este dispositivo…');await ensureAnonymousAuth();setStatus('Autorizando dispositivo…');const homeId=await atomicClaimAndJoin(token);const homeRef=syncRef(homeId);state.syncCode=homeId;localStorage.setItem('homebase_sync_code',state.syncCode);const snap=await timeout(homeRef.get({source:'server'}),SERVER_TIMEOUT_MS,'home');if(snap.exists&&typeof applyRemotePayload==='function'){state.applyingRemote=true;try{applyRemotePayload(snap.data()||{});localStorage.setItem('homebase_v2_items',JSON.stringify(state.items));localStorage.setItem('homebase_roster_meta',JSON.stringify(state.rosterMeta));if(typeof profilePhotos!=='undefined')localStorage.setItem('homebase_profile_photos',JSON.stringify(profilePhotos))}finally{state.applyingRemote=false}}authorizedUids=uniqueUids((snap.data()||{}).authorizedUids);membershipState=authorizedUids.includes(currentUid)?'authorized':'unauthorized';if(membershipState!=='authorized')throw new Error('Firestore no confirmó la autorización del dispositivo');rememberAuthorization();try{await homeRef.set({securityJoinToken:firebase.firestore.FieldValue.delete()},{merge:true})}catch{}try{await db().collection(INVITE_COLLECTION).doc(token).delete()}catch{}startSecureSync();if(typeof render==='function')render();setStatus('Dispositivo autorizado y sincronización activa.','ok')}catch(error){console.error('Production pairing join',error);setStatus(String(error?.message||errorText(error)),isTransient(error)?'warn':'error')}}
function bindProtectedActions(){const syncNowBtn=byId('syncNow');if(!syncNowBtn||typeof refreshFromCloud!=='function'||typeof writeCloud!=='function')return;syncNowBtn.onclick=async()=>{try{await ensureAnonymousAuth();const ok=await verifyMembership({quiet:true});if(!ok){setStatus(membershipState==='unauthorized'?'Este dispositivo necesita volver a autorizarse.':'No se ha podido confirmar la conexión. Reintentaremos.',membershipState==='unauthorized'?'error':'warn');return}await refreshFromCloud(true);await writeCloud();setStatus('Sincronización completada.','ok')}catch(error){console.error('Production secure sync',error);setStatus(errorText(error),isTransient(error)?'warn':'error')}}}
async function start(){ensureStatusUi();byId('productionFirestoreDiagnostics')?.remove();bindProtectedActions();try{await ensureAnonymousAuth();if(!state?.syncCode){membershipState='unknown';setStatus('Este dispositivo aún no está vinculado a un hogar.','normal');refreshPairingUi();return}setStatus('Comprobando acceso seguro…');const ok=await verifyMembership({quiet:false});if(ok)startSecureSync();window.dispatchEvent(new CustomEvent('homebase:auth-ready',{detail:{uid:currentUid,authorized:membershipState==='authorized',state:membershipState}}))}catch(error){console.error('Homebase production auth',error);setStatus(errorText(error),isTransient(error)?'warn':'error');window.dispatchEvent(new CustomEvent('homebase:auth-error',{detail:{message:String(error?.message||error)}}))}}
window.HOMEBASE_SECURITY={version:VERSION,appVersion:APP_VERSION,build:APP_BUILD,getUid:()=>currentUid,getAuthorizedUids:()=>[...authorizedUids],getMembershipState:()=>membershipState,ensureAuth:ensureAnonymousAuth,verifyMembership,createPairingInvite,joinWithPairingCode};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
