(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';
const ITEMS_KEY='homebase_expiries_v2';
const TOMBS_KEY='homebase_expiries_v2_tombstones';
const CLOUD_FIELD='betaExpiriesV2';
let unsubscribe=null;
let knownIds=new Set();
let syncing=false;
let queued=false;
let retryTimer=0;
let attaching=false;

const readJson=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'');return value??fallback}catch{return fallback}};
const readItems=()=>{const value=readJson(ITEMS_KEY,[]);return Array.isArray(value)?value:[]};
const readTombs=()=>{const value=readJson(TOMBS_KEY,{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{}};
const stamp=item=>Number(item?.updatedAt||item?.createdAt||0)||0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function syncCode(){return String(localStorage.getItem('homebase_sync_code')||'').trim()}
function db(){return window.cloudDb||null}
function ref(){const code=syncCode(),database=db();return code&&database?database.collection('homebaseSyncs').doc('BETA_'+code):null}
async function ensureReady(){
 const security=window.HOMEBASE_BETA_SECURITY;
 if(!security?.ensureAuth)throw new Error('Beta security not ready');
 await security.ensureAuth();
 if(!window.HOMEBASE_AUTH_UID)throw new Error('Beta auth user not ready');
 if(!db()||!syncCode())throw new Error('Beta sync document not ready');
 return true;
}

function normalizePayload(raw){
 const payload=raw&&typeof raw==='object'?raw:{};
 const items=Array.isArray(payload.items)?payload.items.filter(x=>x&&x.id):[];
 const deleted=payload.deleted&&typeof payload.deleted==='object'&&!Array.isArray(payload.deleted)?payload.deleted:{};
 return {items,deleted};
}
function mergeState(localItems,localDeleted,remoteItems,remoteDeleted){
 const deleted={...remoteDeleted};
 for(const [id,ts] of Object.entries(localDeleted||{}))deleted[id]=Math.max(Number(deleted[id]||0),Number(ts||0));
 const map=new Map();
 for(const item of remoteItems||[]){if(item?.id)map.set(String(item.id),item)}
 for(const item of localItems||[]){
   if(!item?.id)continue;
   const id=String(item.id),prev=map.get(id);
   if(!prev||stamp(item)>=stamp(prev))map.set(id,item);
 }
 for(const [id,tsRaw] of Object.entries(deleted)){
   const item=map.get(id),ts=Number(tsRaw||0);
   if(item&&ts>=stamp(item))map.delete(id);
   else if(item&&stamp(item)>ts)delete deleted[id];
 }
 const items=[...map.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 return {items,deleted};
}
function writeLocal(items,deleted,{reload=false}={}){
 const currentItems=readItems(),currentDeleted=readTombs();
 const changed=!same(currentItems,items)||!same(currentDeleted,deleted);
 if(!changed)return false;
 localStorage.setItem(ITEMS_KEY,JSON.stringify(items));
 localStorage.setItem(TOMBS_KEY,JSON.stringify(deleted));
 knownIds=new Set(items.map(x=>String(x.id)));
 if(reload){
   const marker='homebase_beta_expiries_sync_reload';
   const signature=String(items.length)+'|'+Object.keys(deleted).length+'|'+items.map(x=>`${x.id}:${stamp(x)}`).join(',');
   if(sessionStorage.getItem(marker)!==signature){sessionStorage.setItem(marker,signature);setTimeout(()=>location.reload(),120)}
 }
 return true;
}
async function transactMerge(){
 await ensureReady();
 const database=db(),doc=ref();if(!database||!doc)return false;
 const localItems=readItems(),localDeleted=readTombs();
 let mergedResult=null;
 await database.runTransaction(async tx=>{
   const snap=await tx.get(doc);const data=snap.exists?(snap.data()||{}):{};
   const remote=normalizePayload(data[CLOUD_FIELD]);
   const merged=mergeState(localItems,localDeleted,remote.items,remote.deleted);
   mergedResult=merged;
   tx.set(doc,{[CLOUD_FIELD]:{items:merged.items,deleted:merged.deleted,updatedAt:Date.now()}},{merge:true});
 });
 if(mergedResult){
   const changed=!same(localItems,mergedResult.items)||!same(localDeleted,mergedResult.deleted);
   if(changed)writeLocal(mergedResult.items,mergedResult.deleted,{reload:true});
 }
 return true;
}
function scheduleRetry(delay=1200){
 clearTimeout(retryTimer);
 retryTimer=setTimeout(async()=>{retryTimer=0;await connect();syncNow()},delay);
}
async function syncNow(){
 if(syncing){queued=true;return}
 syncing=true;
 try{await transactMerge()}catch(error){console.warn('Beta expiries sync',error);scheduleRetry()}finally{syncing=false;if(queued){queued=false;setTimeout(syncNow,150)}}
}
function detectLocalDeletes(){
 const items=readItems(),ids=new Set(items.map(x=>String(x.id))),deleted=readTombs();let changed=false;
 for(const id of knownIds){if(!ids.has(id)){deleted[id]=Math.max(Number(deleted[id]||0),Date.now());changed=true}}
 if(changed)localStorage.setItem(TOMBS_KEY,JSON.stringify(deleted));
 knownIds=ids;
}
function handleLocalUpdate(){detectLocalDeletes();syncNow()}
async function attachListener(){
 if(unsubscribe||attaching)return !!unsubscribe;
 attaching=true;
 try{
   await ensureReady();
   const doc=ref();if(!doc)return false;
   let localUnsubscribe=null;
   localUnsubscribe=doc.onSnapshot(snapshot=>{
     if(!snapshot.exists)return;
     const remote=normalizePayload((snapshot.data()||{})[CLOUD_FIELD]);
     const localItems=readItems(),localDeleted=readTombs();
     const merged=mergeState(localItems,localDeleted,remote.items,remote.deleted);
     const localChanged=!same(localItems,merged.items)||!same(localDeleted,merged.deleted);
     if(localChanged)writeLocal(merged.items,merged.deleted,{reload:true});
     const cloudNeedsWrite=!same(remote.items,merged.items)||!same(remote.deleted,merged.deleted);
     if(cloudNeedsWrite)syncNow();
   },error=>{
     console.warn('Beta expiries listener',error);
     try{localUnsubscribe?.()}catch{}
     if(unsubscribe===localUnsubscribe)unsubscribe=null;
     scheduleRetry(1000);
   });
   unsubscribe=localUnsubscribe;
   return true;
 }catch(error){
   console.warn('Beta expiries attach',error);
   unsubscribe=null;
   scheduleRetry();
   return false;
 }finally{attaching=false}
}
async function connect(){
 const attached=await attachListener();
 if(attached)await syncNow();
 return attached;
}
function install(){
 knownIds=new Set(readItems().map(x=>String(x.id)));
 window.addEventListener('homebase:expiries-updated',handleLocalUpdate);
 let tries=0;
 const start=async()=>{
   tries++;
   if(await connect())return;
   if(tries<120)setTimeout(start,500);
 };
 setTimeout(start,100);
 window.addEventListener('pageshow',()=>{connect()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)connect()});
 window.addEventListener('online',()=>connect());
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_EXPIRIES_SYNC={version:VERSION,sync:syncNow,connect};
})();
