(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='4';
const EXP_KEY='homebase_expiries_v2';
const EXP_TOMBS='homebase_expiries_v2_tombstones';
const CORE_TOMBS='homebase_beta_core_tombstones_v1';

const readJson=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'');return v??fallback}catch{return fallback}};
const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const stamp=item=>Number(item?.updatedAt||item?.deletedAt||item?.createdAt||0)||0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const coreItems=()=>typeof state!=='undefined'&&Array.isArray(state.items)?state.items:[];
const readCoreTombs=()=>{const v=readJson(CORE_TOMBS,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
const readExp=()=>{const v=readJson(EXP_KEY,[]);return Array.isArray(v)?v:[]};
const readExpTombs=()=>{const v=readJson(EXP_TOMBS,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};

function normalizeCoreTombs(items,tombs){
 const next={...(tombs||{})};
 for(const item of items||[]){
   if(!item?.id)continue;
   const id=String(item.id),ts=Number(next[id]||0),s=stamp(item);
   if(item.deletedAt){next[id]=Math.max(ts,Number(item.deletedAt||s||Date.now()));continue;}
   if(ts&&s>ts)delete next[id];
 }
 return next;
}
function recordPermanentDelete(id){
 if(!id)return;
 const item=coreItems().find(x=>String(x?.id||'')===String(id));
 const itemStamp=stamp(item),tombs=readCoreTombs();
 tombs[String(id)]=Math.max(Number(tombs[String(id)]||0),Date.now(),itemStamp+1);
 writeJson(CORE_TOMBS,tombs);
}
function collectCoreTombs(){
 const next=normalizeCoreTombs(coreItems(),readCoreTombs());
 writeJson(CORE_TOMBS,next);
 return next;
}
function mergeCore(localItems,remoteItems,tombs){
 const map=new Map();
 const put=item=>{
   if(!item?.id)return;
   const id=String(item.id),prev=map.get(id),s=stamp(item),ps=stamp(prev);
   if(!prev||s>ps||(s===ps&&!!item.deletedAt&&!prev.deletedAt))map.set(id,item);
 };
 for(const item of localItems||[])put(item);
 for(const item of remoteItems||[])put(item);
 const out=[];
 for(const item of map.values()){
   const id=String(item.id),ts=Number(tombs?.[id]||0),s=stamp(item);
   // A tombstone equal to the item stamp represents the normal soft-delete state.
   // A strictly newer tombstone represents a permanent delete and the item must vanish.
   if(ts>s)continue;
   if(ts===s&&!item.deletedAt)out.push({...item,deletedAt:ts,updatedAt:Math.max(s,ts)});
   else out.push(item);
 }
 return out;
}
function mergeExp(localItems,localDeleted,remoteItems,remoteDeleted){
 const deleted={...(remoteDeleted||{})};
 for(const [id,ts] of Object.entries(localDeleted||{}))deleted[id]=Math.max(Number(deleted[id]||0),Number(ts||0));
 const map=new Map();
 for(const item of remoteItems||[])if(item?.id)map.set(String(item.id),item);
 for(const item of localItems||[]){if(!item?.id)continue;const id=String(item.id),prev=map.get(id);if(!prev||stamp(item)>=stamp(prev))map.set(id,item)}
 for(const [id,tsRaw] of Object.entries(deleted)){
   const item=map.get(id),ts=Number(tsRaw||0);
   if(item&&ts>=stamp(item))map.delete(id);
   else if(item&&stamp(item)>ts)delete deleted[id];
 }
 return {items:[...map.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id))),deleted};
}
function patchMergeItems(){
 if(typeof mergeItems!=='function'||mergeItems.__betaConvergent)return false;
 const wrapped=function(localItems,remoteItems){
   const tombs=normalizeCoreTombs([...(localItems||[]),...(remoteItems||[])],readCoreTombs());
   writeJson(CORE_TOMBS,tombs);
   return mergeCore(localItems,remoteItems,tombs);
 };
 wrapped.__betaConvergent=true;mergeItems=wrapped;return true;
}
function patchPayload(){
 if(typeof cloudPayload!=='function'||cloudPayload.__betaIntegrityV4)return false;
 const original=cloudPayload;
 const wrapped=function(){
   const payload=original();
   const coreTombs=collectCoreTombs();
   payload.items=mergeCore([],coreItems(),coreTombs);
   payload.betaCoreTombstonesV1=coreTombs;
   payload.betaExpiriesV2={items:readExp(),deleted:readExpTombs(),updatedAt:Date.now()};
   payload.betaSyncIntegrityVersion=4;
   return payload;
 };
 wrapped.__betaIntegrityV4=true;cloudPayload=wrapped;return true;
}
function patchRemote(){
 if(typeof applyRemotePayload!=='function'||applyRemotePayload.__betaIntegrityV4)return false;
 const original=applyRemotePayload;
 const wrapped=function(data){
   const remoteTombs=data?.betaCoreTombstonesV1&&typeof data.betaCoreTombstonesV1==='object'?data.betaCoreTombstonesV1:{};
   let tombs={...remoteTombs};
   for(const [id,ts] of Object.entries(readCoreTombs()))tombs[id]=Math.max(Number(tombs[id]||0),Number(ts||0));
   tombs=normalizeCoreTombs([...(coreItems()||[]),...(data?.items||[])],tombs);
   writeJson(CORE_TOMBS,tombs);
   const patchedData={...data,items:mergeCore(coreItems(),data?.items||[],tombs)};
   original(patchedData);
   if(typeof state!=='undefined'&&Array.isArray(state.items))state.items=mergeCore([],state.items,tombs);
   const remoteExp=data?.betaExpiriesV2||{};
   const mergedExp=mergeExp(readExp(),readExpTombs(),Array.isArray(remoteExp.items)?remoteExp.items:[],remoteExp.deleted&&typeof remoteExp.deleted==='object'?remoteExp.deleted:{});
   const changed=!same(readExp(),mergedExp.items)||!same(readExpTombs(),mergedExp.deleted);
   if(changed){writeJson(EXP_KEY,mergedExp.items);writeJson(EXP_TOMBS,mergedExp.deleted);window.dispatchEvent(new CustomEvent('homebase:expiries-remote-applied',{detail:{count:mergedExp.items.length}}));}
 };
 wrapped.__betaIntegrityV4=true;applyRemotePayload=wrapped;return true;
}
function detectExpiryDeletes(){
 const previous=window.__hbBetaExpiryIds||new Set(),current=new Set(readExp().map(x=>String(x.id))),tombs=readExpTombs();let changed=false;
 for(const id of previous)if(!current.has(id)){tombs[id]=Math.max(Number(tombs[id]||0),Date.now());changed=true}
 for(const item of readExp()){const id=String(item.id),ts=Number(tombs[id]||0);if(ts&&stamp(item)>ts){delete tombs[id];changed=true}}
 window.__hbBetaExpiryIds=current;if(changed)writeJson(EXP_TOMBS,tombs);
}
function schedule(){try{if(typeof scheduleCloudSave==='function')scheduleCloudSave()}catch{}}
function restoreCoreItem(id){
 id=String(id||'');if(!id)return false;
 const item=coreItems().find(x=>String(x?.id)===id);if(!item)return false;
 const now=Date.now();item.deletedAt=null;item.updatedAt=now;
 const tombs=readCoreTombs();delete tombs[id];writeJson(CORE_TOMBS,tombs);
 try{localStorage.setItem('homebase_v2_items',JSON.stringify(state.items))}catch{}
 try{if(typeof render==='function')render()}catch{}
 try{if(typeof renderTrash==='function')renderTrash()}catch{}
 try{if(typeof bindDynamic==='function')bindDynamic()}catch{}
 schedule();return true;
}
function install(){
 window.__hbBetaExpiryIds=new Set(readExp().map(x=>String(x.id)));
 let tries=0;
 const patch=()=>{tries++;patchMergeItems();patchPayload();patchRemote();if(tries<80&&(!mergeItems?.__betaConvergent||!cloudPayload?.__betaIntegrityV4||!applyRemotePayload?.__betaIntegrityV4))setTimeout(patch,100)};
 patch();
 document.addEventListener('click',event=>{
   const restore=event.target.closest?.('[data-restore]');
   if(restore){event.preventDefault();event.stopImmediatePropagation();restoreCoreItem(restore.dataset.restore);return;}
   const detail=event.target.closest?.('#restoreFromTrashDetail');
   if(detail){event.preventDefault();event.stopImmediatePropagation();const id=String(state?.trashDetailId||'');if(restoreCoreItem(id)){try{document.getElementById('trashDetailDialog')?.close()}catch{}}return;}
   const permanent=event.target.closest?.('[data-permanent]');if(permanent)recordPermanentDelete(permanent.dataset.permanent);
 },true);
 window.addEventListener('homebase:expiries-updated',()=>{detectExpiryDeletes();schedule()});
 window.addEventListener('homebase:expiries-remote-applied',()=>{setTimeout(()=>{try{location.reload()}catch{}},80)},{once:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){collectCoreTombs();detectExpiryDeletes();schedule()}});
 window.addEventListener('pageshow',()=>{collectCoreTombs();detectExpiryDeletes();schedule()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SYNC_INTEGRITY={version:VERSION,restore:restoreCoreItem};
})();
