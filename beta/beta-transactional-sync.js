(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
const CORE_TOMBS='homebase_beta_core_tombstones_v1';
const EXP_KEY='homebase_expiries_v2';
const EXP_TOMBS='homebase_expiries_v2_tombstones';

const readJson=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'');return v??fallback}catch{return fallback}};
const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const stamp=item=>Number(item?.updatedAt||item?.deletedAt||item?.createdAt||0)||0;

function mergeTombs(a,b){
 const out={...(a||{})};
 for(const [id,ts] of Object.entries(b||{}))out[id]=Math.max(Number(out[id]||0),Number(ts||0));
 return out;
}
function normalizeTombs(items,tombs){
 const next={...(tombs||{})};
 for(const item of items||[]){
   if(!item?.id)continue;
   const id=String(item.id),ts=Number(next[id]||0),s=stamp(item);
   if(item.deletedAt){next[id]=Math.max(ts,Number(item.deletedAt||s||Date.now()));continue;}
   if(ts&&s>ts)delete next[id];
 }
 return next;
}
function mergeItemsByVersion(a,b,tombs){
 const map=new Map();
 const put=item=>{
   if(!item?.id)return;
   const id=String(item.id),prev=map.get(id),s=stamp(item),ps=stamp(prev);
   if(!prev||s>ps||(s===ps&&!!item.deletedAt&&!prev.deletedAt))map.set(id,item);
 };
 for(const item of a||[])put(item);
 for(const item of b||[])put(item);
 const out=[];
 for(const item of map.values()){
   const id=String(item.id),ts=Number(tombs?.[id]||0),s=stamp(item);
   if(ts>s)continue;
   if(ts===s&&!item.deletedAt)out.push({...item,deletedAt:ts,updatedAt:Math.max(s,ts)});
   else out.push(item);
 }
 return out;
}
function mergeExp(localBlock,remoteBlock){
 const localItems=Array.isArray(localBlock?.items)?localBlock.items:[];
 const remoteItems=Array.isArray(remoteBlock?.items)?remoteBlock.items:[];
 const deleted=mergeTombs(remoteBlock?.deleted,localBlock?.deleted);
 const map=new Map();
 const put=item=>{if(!item?.id)return;const id=String(item.id),prev=map.get(id);if(!prev||stamp(item)>=stamp(prev))map.set(id,item)};
 remoteItems.forEach(put);localItems.forEach(put);
 for(const [id,tsRaw] of Object.entries(deleted)){
   const item=map.get(id),ts=Number(tsRaw||0);
   if(item&&ts>=stamp(item))map.delete(id);
   else if(item&&stamp(item)>ts)delete deleted[id];
 }
 return {items:[...map.values()],deleted,updatedAt:Date.now()};
}
function cleanSecurityFields(payload){
 delete payload.authorizedUids;
 delete payload.securityJoinToken;
 delete payload.securityUpdatedAt;
 return payload;
}
function patchWriteCloud(){
 if(typeof writeCloud!=='function')return false;
 if(writeCloud.__betaTransactional)return true;
 const wrapped=async function(){
   if(!cloudDb||!state?.syncCode)return;
   if(window.HOMEBASE_BETA_SECURITY?.isRestorePaused?.())return;
   try{
     if(typeof setSyncStatus==='function')setSyncStatus('saving','Guardando los últimos cambios…');
     const ref=syncDoc();
     const localPayload=cleanSecurityFields({...cloudPayload()});
     await cloudDb.runTransaction(async tx=>{
       const snap=await tx.get(ref);
       const remote=snap.exists?(snap.data()||{}):{};
       let tombs=mergeTombs(remote.betaCoreTombstonesV1,localPayload.betaCoreTombstonesV1);
       tombs=normalizeTombs([...(remote.items||[]),...(localPayload.items||[])],tombs);
       const items=mergeItemsByVersion(remote.items||[],localPayload.items||[],tombs);
       tombs=normalizeTombs(items,tombs);
       const expiries=mergeExp(localPayload.betaExpiriesV2||{items:readJson(EXP_KEY,[]),deleted:readJson(EXP_TOMBS,{})},remote.betaExpiriesV2||{});
       const finalPayload=cleanSecurityFields({...localPayload,items,betaCoreTombstonesV1:tombs,betaExpiriesV2:expiries,betaSyncIntegrityVersion:5,betaTransactionalSyncVersion:2,updatedAt:Date.now()});
       tx.set(ref,finalPayload,{merge:true});
       writeJson(CORE_TOMBS,tombs);
       writeJson(EXP_TOMBS,expiries.deleted);
     });
     if(typeof setSyncStatus==='function')setSyncStatus('ok','Últimos cambios sincronizados.');
   }catch(error){
     console.error('Beta transactional sync',error);
     if(typeof setSyncStatus==='function')setSyncStatus('error','Comprueba la conexión y las reglas de Firestore.');
   }
 };
 wrapped.__betaTransactional=true;
 writeCloud=wrapped;
 return true;
}
function install(){
 let tries=0;
 const attempt=()=>{tries++;if(!patchWriteCloud()&&tries<80)setTimeout(attempt,100)};
 attempt();
 window.addEventListener('pageshow',patchWriteCloud);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)patchWriteCloud()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_TRANSACTIONAL_SYNC={version:VERSION,patch:patchWriteCloud};
})();
