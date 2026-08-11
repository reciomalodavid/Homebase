(()=>{
'use strict';
const VERSION='1';
const TIMEOUT_MS=6000;

function byId(id){return document.getElementById(id)}
function timeout(promise,ms,label){
 return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label}: timeout ${ms} ms`)),ms))]);
}
function code(){return String((window.state&&state.syncCode)||localStorage.getItem('homebase_sync_code')||'').trim()}
function short(value,max=80){const s=String(value??'');return s.length>max?s.slice(0,max-1)+'…':s}
function ensureUi(){
 let box=byId('productionFirestoreDiagnostics');if(box)return box;
 const security=byId('productionSecurityStatus');
 const details=document.querySelector('#syncSection .sync-details');
 if(!details)return null;
 box=document.createElement('div');box.id='productionFirestoreDiagnostics';
 box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(49,94,139,.06);border:1px solid rgba(49,94,139,.15);font-size:11px;line-height:1.4;color:#334155';
 box.innerHTML='<strong>Diagnóstico Firestore · solo lectura</strong><div id="productionFirestoreDiagnosticsText" style="margin-top:5px;white-space:pre-wrap">Esperando Auth…</div>';
 if(security?.parentNode)security.insertAdjacentElement('afterend',box);else details.prepend(box);
 return box;
}
function show(lines){ensureUi();const el=byId('productionFirestoreDiagnosticsText');if(el)el.textContent=Array.isArray(lines)?lines.join('\n'):String(lines)}
function err(error){return `${error?.code||error?.name||'Error'} · ${short(error?.message||error)}`}
async function waitForUid(){
 for(let i=0;i<80;i++){
  const uid=window.HOMEBASE_AUTH_UID||firebase?.auth?.()?.currentUser?.uid;
  if(uid)return uid;
  await new Promise(r=>setTimeout(r,100));
 }
 throw new Error('Auth UID no disponible tras 8 s');
}
async function run(){
 ensureUi();
 const lines=[];
 try{
  const uid=await waitForUid();
  const home=code();
  const projectId=firebase?.app?.()?.options?.projectId||'';
  const db=window.cloudDb||firebase?.firestore?.();
  lines.push(`Auth: OK · UID ${uid.slice(0,7)}…${uid.slice(-6)}`);
  lines.push(`Online: ${navigator.onLine?'sí':'no'} · Proyecto: ${projectId||'?'}`);
  lines.push(`Hogar: ${home||'(sin código)'}`);
  if(!home){show(lines);return}
  if(!db){lines.push('SDK Firestore: NO disponible');show(lines);return}
  const ref=db.collection('homebaseSyncs').doc(home);

  try{
   const snap=await timeout(ref.get({source:'cache'}),2000,'cache');
   lines.push(`SDK caché: OK · documento ${snap.exists?'existe':'no existe'}`);
  }catch(error){lines.push(`SDK caché: ${err(error)}`)}
  show(lines.concat('SDK servidor: probando…'));

  try{
   const snap=await timeout(ref.get({source:'server'}),TIMEOUT_MS,'server get');
   lines.push(`SDK servidor: OK · documento ${snap.exists?'existe':'no existe'}`);
  }catch(error){lines.push(`SDK servidor: ${err(error)}`)}
  show(lines.concat('REST directo: probando…'));

  try{
   const user=firebase.auth().currentUser;
   const token=await timeout(user.getIdToken(false),3000,'ID token');
   const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/homebaseSyncs/${encodeURIComponent(home)}`;
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
   let response;
   try{response=await fetch(url,{method:'GET',headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:controller.signal})}finally{clearTimeout(timer)}
   const text=await response.text();
   if(response.ok)lines.push(`REST directo: OK · HTTP ${response.status}`);
   else lines.push(`REST directo: HTTP ${response.status} · ${short(text,120)}`);
  }catch(error){lines.push(`REST directo: ${err(error)}`)}

  try{
   await timeout(db.waitForPendingWrites(),2500,'pending writes');
   lines.push('Pending writes: ninguno pendiente');
  }catch(error){lines.push(`Pending writes: ${err(error)}`)}
  show(lines);
 }catch(error){lines.push(`Diagnóstico: ${err(error)}`);show(lines)}
}
function start(){ensureUi();setTimeout(run,100)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_FIRESTORE_DIAGNOSTICS={version:VERSION,run};
})();