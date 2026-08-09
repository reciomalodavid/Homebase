(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='2';
const GENERIC_OFF='OFF';
const OFFICIAL_OFF_CODES=new Set([
  'O_+','O_FIX','O_FLEX','O_L','O_M','O_NHCA','O_RES','O_S','O_SUR','O_TX','O_TZ','O_U','O_V'
]);
let running=false;

function normalizeCode(value){
  return String(value||'').trim().toUpperCase().replace(/\s+/g,'_');
}
function codeOf(item){
  return normalizeCode(item?.rosterData?.code);
}
function dateOf(item){
  return item?.rosterData?.sourceDate||item?.date||'';
}
function dutyCode(duty){
  return normalizeCode(duty?.code);
}
function dutyDate(duty){
  return duty?.sourceDate||duty?.date||'';
}

function normalizeParsedRoster(parsed){
  if(!parsed||!Array.isArray(parsed.duties)||!parsed.duties.length)return parsed;

  const officialOffDates=new Set(
    parsed.duties
      .filter(duty=>OFFICIAL_OFF_CODES.has(dutyCode(duty)))
      .map(dutyDate)
      .filter(Boolean)
  );
  if(!officialOffDates.size)return parsed;

  let removed=0;
  const duties=parsed.duties.filter(duty=>{
    if(dutyCode(duty)!==GENERIC_OFF)return true;
    const date=dutyDate(duty);
    if(!date||!officialOffDates.has(date))return true;
    removed++;
    return false;
  });

  if(!removed)return parsed;
  parsed.duties=duties;
  parsed.betaSuppressedGenericOffs=(Number(parsed.betaSuppressedGenericOffs)||0)+removed;

  if(parsed.counts&&typeof parsed.counts==='object'){
    if(Number.isFinite(Number(parsed.counts.off)))parsed.counts.off=Math.max(0,Number(parsed.counts.off)-removed);
  }

  console.info(`[Homebase Beta] parser suppressed ${removed} generic OFF summary duplicate(s)`);
  return parsed;
}

function patchRosterParser(){
  let parser=null;
  try{if(typeof RosterParser!=='undefined')parser=RosterParser}catch{}
  if(!parser||typeof parser.parse!=='function'||parser.parse.__betaRosterParserClean)return false;

  const original=parser.parse;
  const wrapped=function(...args){
    const parsed=original.apply(this,args);
    return normalizeParsedRoster(parsed);
  };
  wrapped.__betaRosterParserClean=true;
  wrapped.__betaRosterParserOriginal=original;
  parser.parse=wrapped;
  return true;
}

function activeRosterItems(){
  if(typeof state==='undefined'||!Array.isArray(state.items))return[];
  return state.items.filter(item=>item?.source==='roster'&&!item?.deletedAt);
}

function dedupeGenericOffs({sync=false}={}){
  if(running||typeof state==='undefined'||!Array.isArray(state.items))return 0;
  running=true;
  try{
    const active=activeRosterItems();
    const officialDates=new Set(
      active.filter(item=>OFFICIAL_OFF_CODES.has(codeOf(item))).map(dateOf).filter(Boolean)
    );
    if(!officialDates.size)return 0;

    const stamp=Date.now();
    let changed=0;
    state.items=state.items.map(item=>{
      if(item?.source!=='roster'||item?.deletedAt)return item;
      if(codeOf(item)!==GENERIC_OFF)return item;
      const date=dateOf(item);
      if(!date||!officialDates.has(date))return item;
      changed++;
      return {
        ...item,
        deletedAt:stamp,
        rosterRemoved:true,
        betaRosterDedupe:true,
        betaRosterDedupeReason:'generic-off-shadowed-by-official-code',
        updatedAt:Math.max(Number(item.updatedAt)||0,stamp)
      };
    });

    if(!changed)return 0;
    localStorage.setItem('homebase_v2_items',JSON.stringify(state.items));
    if(typeof render==='function')render();
    if(sync){
      if(typeof scheduleCloudSave==='function')scheduleCloudSave();
      else if(typeof writeCloud==='function')writeCloud();
    }
    window.dispatchEvent(new CustomEvent('homebase:beta-roster-deduped',{detail:{count:changed}}));
    console.info(`[Homebase Beta] roster dedupe removed ${changed} stored generic OFF duplicate(s)`);
    return changed;
  }finally{running=false}
}

function wrap(name){
  const original=window[name]||globalThis[name];
  if(typeof original!=='function'||original.__betaRosterDedupeWrapped)return;
  const wrapped=function(...args){
    const result=original.apply(this,args);
    setTimeout(()=>dedupeGenericOffs({sync:true}),0);
    return result;
  };
  wrapped.__betaRosterDedupeWrapped=true;
  try{window[name]=wrapped}catch{}
  try{globalThis[name]=wrapped}catch{}
}

function install(){
  patchRosterParser();
  wrap('applyPendingRoster');
  wrap('applyRemotePayload');
  setTimeout(()=>dedupeGenericOffs({sync:true}),250);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>dedupeGenericOffs({sync:true}),100)});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_DEDUPE={
  version:VERSION,
  normalizeParsed:normalizeParsedRoster,
  run:()=>dedupeGenericOffs({sync:true})
};
})();
