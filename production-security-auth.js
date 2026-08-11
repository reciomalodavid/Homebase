(()=>{
'use strict';

const VERSION='3';
const INVITE_COLLECTION='homebaseDeviceInvites';
const INVITE_TTL_MS=10*60*1000;
let currentUid='';
let authorizedUids=[];
let authPromise=null;
let persistenceReady=false;

function byId(id){return document.getElementById(id)}
function familyCode(){return String((window.state&&state.syncCode)||localStorage.getItem('homebase_sync_code')||'').trim()}
function homeRef(){const code=familyCode();return code&&window.firebase?firebase.firestore().collection('homebaseSyncs').doc(code):null}
function mergeUid(list,uid){const out=[];for(const value of Array.isArray(list)?list:[]){if(typeof value==='string'&&value&&!out.includes(value))out.push(value)}if(uid&&!out.includes(uid))out.push(uid);return out}
function shortUid(uid){const v=String(uid||'');return v.length>16?`${v.slice(0,7)}…${v.slice(-6)}`:v}
function withTimeout(promise,ms,label){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} agotó el tiempo de espera`)),ms))])}

function ensureStatusUi(){
  if(byId('productionSecurityStatus'))return byId('productionSecurityStatus');
  const details=document.querySelector('#syncSection .sync-details');if(!details)return null;
  const box=document.createElement('div');box.id='productionSecurityStatus';
  box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(217,120,31,.07);border:1px solid rgba(217,120,31,.16);font-size:12px;line-height:1.35;color:#6e4a27';
  box.innerHTML='<strong>Seguridad del hogar</strong><div id="productionSecurityStatusText" style="margin-top:3px">Preparando autenticación…</div><div id="productionSecurityUid" style="margin-top:4px;color:#8a6a4b"></div><div id="productionSecurityActions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><button id="productionAuthorizeDevice" type="button" style="border:0;border-radius:10px;padding:8px 10px;background:#d9781f;color:white;font-weight:800">Autorizar otro dispositivo</button></div>';
  details.prepend(box);
  byId('productionAuthorizeDevice')?.addEventListener('click',createPairingInvite);
  return box;
}
function setStatus(text,isError=false){ensureStatusUi();const el=byId('productionSecurityStatusText');if(!el)return;el.textContent=text;el.style.color=isError?'#b42318':'#6e4a27'}
function setUid(){const el=byId('productionSecurityUid');if(el)el.textContent=currentUid?`UID actual: ${shortUid(currentUid)}`:''}

async function preparePersistence(auth){
  if(persistenceReady)return;
  try{
    if(auth?.setPersistence&&firebase.auth?.Auth?.Persistence?.LOCAL){
      await withTimeout(auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL),1800,'Persistencia Auth');
    }
  }catch(error){
    console.warn('Homebase Auth persistence fallback',error);
  }
  persistenceReady=true;
}
function waitForInitialAuthState(auth,timeoutMs=1800){
  return new Promise(resolve=>{let done=false,unsub=null;const finish=user=>{if(done)return;done=true;clearTimeout(timer);try{unsub?.()}catch{}resolve(user||auth.currentUser||null)};const timer=setTimeout(()=>finish(auth.currentUser),timeoutMs);try{unsub=auth.onAuthStateChanged(user=>finish(user),()=>finish(auth.currentUser))}catch{finish(auth.currentUser)}})
}
async function ensureAuth(){
  if(!window.firebase||typeof firebase.auth!=='function')throw new Error('Firebase Auth no está disponible');
  const auth=firebase.auth();
  if(auth.currentUser){currentUid=auth.currentUser.uid;window.HOMEBASE_AUTH_UID=currentUid;setUid();return auth.currentUser}
  if(authPromise)return authPromise;
  authPromise=(async()=>{
    setStatus('Autenticando este dispositivo…');
    await preparePersistence(auth);
    let user=auth.currentUser;
    if(!user)user=await waitForInitialAuthState(auth);
    if(!user){setStatus('Creando identidad segura del dispositivo…');const result=await withTimeout(auth.signInAnonymously(),8000,'Inicio de sesión anónimo');user=result.user}
    if(!user)throw new Error('No se pudo iniciar la sesión segura');
    currentUid=user.uid;window.HOMEBASE_AUTH_UID=currentUid;setUid();return user;
  })();
  try{return await authPromise}finally{authPromise=null}
}

async function loadMembership(){
  const ref=homeRef();if(!ref||!currentUid){authorizedUids=mergeUid([],currentUid);return {exists:false,securityVersion:0,member:false}}
  setStatus('Comprobando autorización del dispositivo…');
  const snap=await withTimeout(ref.get(),8000,'Lectura del hogar');
  if(!snap.exists){authorizedUids=mergeUid([],currentUid);return {exists:false,securityVersion:0,member:false}}
  const data=snap.data()||{};authorizedUids=Array.isArray(data.authorizedUids)?[...new Set(data.authorizedUids.filter(x=>typeof x==='string'&&x))]:[];
  return {exists:true,securityVersion:Number(data.securityVersion||0),member:authorizedUids.includes(currentUid)};
}
async function enrollForMigration(){
  const ref=homeRef();if(!ref||!currentUid)return;
  setStatus('Registrando este dispositivo para la migración segura…');
  await withTimeout(ref.set({authorizedUids:firebase.firestore.FieldValue.arrayUnion(currentUid),securityVersion:2,securityMigrationStage:'device-enrollment',securityUpdatedAt:Date.now()},{merge:true}),8000,'Registro del dispositivo');
  authorizedUids=mergeUid(authorizedUids,currentUid);
}

function randomToken(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('')}
function formatToken(token){return String(token||'').replace(/(.{4})/g,'$1-').replace(/-$/,'')}
async function createPairingInvite(){
  try{
    await ensureAuth();const code=familyCode();if(!code)throw new Error('Este dispositivo no está vinculado a un hogar');
    if(!authorizedUids.includes(currentUid))throw new Error('Este dispositivo todavía no consta como autorizado');
    const token=randomToken(),now=Date.now();
    await withTimeout(firebase.firestore().collection(INVITE_COLLECTION).doc(token).set({homeId:code,createdByUid:currentUid,createdAt:firebase.firestore.Timestamp.fromMillis(now),expiresAt:firebase.firestore.Timestamp.fromMillis(now+INVITE_TTL_MS),claimedUid:null,securityVersion:3}),8000,'Creación del código temporal');
    const shown=formatToken(token);setStatus(`Código temporal creado. Caduca en 10 minutos: ${shown}`);
    try{await navigator.clipboard.writeText(shown);alert(`Código temporal copiado.\n\n${shown}`)}catch{prompt('Copia este código temporal. Caduca en 10 minutos.',shown)}
  }catch(error){
    console.warn('Production pairing invite',error);
    const denied=String(error?.code||'')==='permission-denied';
    setStatus(denied?'El dispositivo está registrado. El pairing se activará al cerrar la migración de producción.':String(error?.message||error),true)
  }
}

async function start(){
  ensureStatusUi();
  try{
    await ensureAuth();
    if(!familyCode()){setStatus('Autenticación activa · todavía no hay hogar vinculado.');return}
    const membership=await loadMembership();
    if(membership.securityVersion>=3){
      if(membership.member)setStatus('Autenticación activa · este dispositivo está autorizado.');
      else setStatus('Este dispositivo conserva el hogar, pero necesita reautorización desde otro dispositivo autorizado.',true);
    }else{
      await enrollForMigration();
      setStatus('Autenticación activa · este dispositivo queda registrado para la migración segura.');
    }
    window.dispatchEvent(new CustomEvent('homebase:auth-ready',{detail:{uid:currentUid,authorized:authorizedUids.includes(currentUid)}}));
  }catch(error){console.error('Homebase production auth',error);setStatus(String(error?.message||error),true);window.dispatchEvent(new CustomEvent('homebase:auth-error',{detail:{message:String(error?.message||error)}}))}
}

window.HOMEBASE_SECURITY={version:VERSION,ensureAuth,enroll:async()=>{await ensureAuth();return enrollForMigration()},getUid:()=>currentUid,getAuthorizedUids:()=>[...authorizedUids],refresh:loadMembership};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();