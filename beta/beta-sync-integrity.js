(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
const EXP_KEY='homebase_expiries_v2';
const EXP_TOMBS='homebase_expiries_v2_tombstones';
const CORE_TOMBS='homebase_beta_core_tombstones_v1';
let lastCoreIds=new Set();

const readJson=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'');return v??fallback}catch{return fallback}};
const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const stamp=item=>Number(item?.updatedAt||item?.deletedAt||item?.createdAt||0)||0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

function coreItems(){return (typeof state!=='undefined'&&Array.isArray(state.items))?state.items:[]}
function readCoreTombs(){const v=readJson(CORE_TOMBS,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function readExp(){const v=readJson(EXP_KEY,[]);return Array.isArray(v)?v:[]}
function readExpTombs(){const v=readJson(EXP_TOMBS,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}

function collectCoreTombs(){
 const tombs=readCoreTombs();
 for(const item of coreItems())if(item?.id&&item.deletedAt)tombs[String(item.id)]=Math.max(Number(tombs[String(item.id)]||0),Number(item.deletedAt||item.updatedAt||Date.now()));
 const currentIds=new Set(coreItems().map(x=>String(x?.id||'')).filter(Boolean));
 for(const id of lastCoreIds)if(!currentIds.has(id))tombs[id]=Math.max(Number(tombs[id]||0),Date.now());
 lastCoreIds=currentIds;writeJson(CORE_TOMBS,tombs);return tombs;
}
function mergeExp(localItems,localDeleted,remoteItems,remoteDeleted){
 const deleted={...(remoteDeleted||{})};for(const [id,ts] of Object.entries(localDeleted||{}))deleted[id]=Math.max(Number(deleted[id]||0),Number(ts||0));
 const map=new Map();for(const item of remoteItems||[])if(item?.id)map.set(String(item.id),item);for(const item of localItems||[]){if(!item?.id)continue;const id=String(item.id),prev=map.get(id);if(!prev||stamp(item)>=stamp(prev))map.set(id,item)}
 for(const [id,tsRaw] of Object.entries(deleted)){const item=map.get(id),ts=Number(tsRaw||0);if(item&&ts>=stamp(item))map.delete(id);else if(item&&stamp(item)>ts)delete deleted[id]}
 return {items:[...map.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id))),deleted};
}
function mergeCoreWithTombs(items,tombs){return (items||[]).map(item=>{const ts=Number(tombs?.[String(item?.id)]||0);if(!item?.id||!ts||Number(item.deletedAt||0)>=ts)return item;return {...item,deletedAt:ts,updatedAt:Math.max(Number(item.updatedAt||0),ts)}})}

function patchPayload(){
 if(typeof cloudPayload!=='function'||cloudPayload.__betaIntegrity)return false;
 const original=cloudPayload;
 const wrapped=function(){
   const payload=original();
   const coreTombs=collectCoreTombs();
   const expItems=readExp(),expDeleted=readExpTombs();
   payload.betaCoreTombstonesV1=coreTombs;
   payload.betaExpiriesV2={items:expItems,deleted:expDeleted,updatedAt:Date.now()};
   payload.betaSyncIntegrityVersion=1;
   return payload;
 };
 wrapped.__betaIntegrity=true;cloudPayload=wrapped;return true;
}
function patchRemote(){
 if(typeof applyRemotePayload!=='function'||applyRemotePayload.__betaIntegrity)return false;
 const original=applyRemotePayload;
 const wrapped=function(data){
   const remoteCoreTombs=data?.betaCoreTombstonesV1&&typeof data.betaCoreTombstonesV1==='object'?data.betaCoreTombstonesV1:{};
   const localCoreTombs=collectCoreTombs();const mergedTombs={...remoteCoreTombs};for(const [id,ts] of Object.entries(localCoreTombs))mergedTombs[id]=Math.max(Number(mergedTombs[id]||0),Number(ts||0));writeJson(CORE_TOMBS,mergedTombs);
   const patchedData={...data,items:mergeCoreWithTombs(data?.items||[],mergedTombs)};
   original(patchedData);
   if(typeof state!=='undefined'&&Array.isArray(state.items))state.items=mergeCoreWithTombs(state.items,mergedTombs);

   const remoteExp=data?.betaExpiriesV2||{};const mergedExp=mergeExp(readExp(),readExpTombs(),Array.isArray(remoteExp.items)?remoteExp.items:[],remoteExp.deleted&&typeof remoteExp.deleted==='object'?remoteExp.deleted:{});
   const changed=!same(readExp(),mergedExp.items)||!same(readExpTombs(),mergedExp.deleted);
   if(changed){writeJson(EXP_KEY,mergedExp.items);writeJson(EXP_TOMBS,mergedExp.deleted);window.dispatchEvent(new CustomEvent('homebase:expiries-remote-applied',{detail:{count:mergedExp.items.length}}));}
 };
 wrapped.__betaIntegrity=true;applyRemotePayload=wrapped;return true;
}
function detectExpiryDeletes(){
 const previous=window.__hbBetaExpiryIds||new Set();const current=new Set(readExp().map(x=>String(x.id)));const tombs=readExpTombs();let changed=false;for(const id of previous)if(!current.has(id)){tombs[id]=Math.max(Number(tombs[id]||0),Date.now());changed=true}window.__hbBetaExpiryIds=current;if(changed)writeJson(EXP_TOMBS,tombs);
}
function schedule(){try{if(typeof scheduleCloudSave==='function')scheduleCloudSave()}catch{}}
function install(){
 lastCoreIds=new Set(coreItems().map(x=>String(x?.id||'')).filter(Boolean));window.__hbBetaExpiryIds=new Set(readExp().map(x=>String(x.id)));
 let tries=0;const patch=()=>{tries++;const a=patchPayload(),b=patchRemote();if((!a&&!cloudPayload?.__betaIntegrity)||(!b&&!applyRemotePayload?.__betaIntegrity)){if(tries<60)setTimeout(patch,100)}};patch();
 window.addEventListener('homebase:expiries-updated',()=>{detectExpiryDeletes();schedule()});
 window.addEventListener('homebase:expiries-remote-applied',()=>{setTimeout(()=>{try{location.reload()}catch{}},80)},{once:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){collectCoreTombs();detectExpiryDeletes();schedule()}});
 window.addEventListener('pageshow',()=>{collectCoreTombs();detectExpiryDeletes();schedule()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SYNC_INTEGRITY={version:VERSION};
})();
