(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
let running=false;
let lastAuto=0;
const AUTO_COOLDOWN_MS=2500;

function linked(){return !!(typeof state!=='undefined'&&state?.syncCode)}
function paused(){return !!window.HOMEBASE_BETA_SECURITY?.isRestorePaused?.()}
async function ensureAuth(){if(window.HOMEBASE_BETA_SECURITY?.ensureAuth)await window.HOMEBASE_BETA_SECURITY.ensureAuth()}
function status(mode,text){try{if(typeof setSyncStatus==='function')setSyncStatus(mode,text)}catch{}}

async function restartListener(){
  try{
    if(typeof startCloudListener==='function')startCloudListener();
  }catch(error){console.warn('Beta sync refresh listener',error)}
}

async function forceSync(){
  if(running||!linked()||paused())return false;
  running=true;
  const btn=document.getElementById('syncNow');
  const oldText=btn?.textContent||'';
  try{
    if(btn){btn.disabled=true;btn.textContent='Sincronizando…';}
    status('saving','Forzando lectura y convergencia con la familia…');
    await ensureAuth();
    await restartListener();
    if(typeof refreshFromCloud==='function')await refreshFromCloud(false);
    if(typeof writeCloud==='function')await writeCloud();
    if(typeof refreshFromCloud==='function')await refreshFromCloud(false);
    try{if(typeof render==='function')render()}catch{}
    status('ok','Sincronización forzada completada.');
    return true;
  }catch(error){
    console.error('Beta force sync',error);
    status('error','No se pudo completar la sincronización forzada.');
    return false;
  }finally{
    running=false;
    if(btn){btn.disabled=false;btn.textContent=oldText||'Forzar sincronización';}
  }
}

async function autoRefresh(reason){
  const now=Date.now();
  if(running||!linked()||paused()||document.hidden||now-lastAuto<AUTO_COOLDOWN_MS)return;
  lastAuto=now;
  try{
    await ensureAuth();
    await restartListener();
    if(typeof refreshFromCloud==='function')await refreshFromCloud(false);
    try{if(typeof render==='function')render()}catch{}
  }catch(error){console.warn('Beta auto refresh',reason,error)}
}

function installButton(){
  const btn=document.getElementById('syncNow');
  if(!btn||btn.dataset.betaForceSync==='1')return false;
  btn.dataset.betaForceSync='1';
  btn.textContent='Forzar sincronización';
  btn.onclick=event=>{event?.preventDefault?.();forceSync()};
  return true;
}

function install(){
  let tries=0;
  const bind=()=>{tries++;if(!installButton()&&tries<80)setTimeout(bind,100)};
  bind();
  window.addEventListener('pageshow',()=>setTimeout(()=>autoRefresh('pageshow'),120));
  window.addEventListener('online',()=>setTimeout(()=>autoRefresh('online'),120));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>autoRefresh('visibility'),120)});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SYNC_REFRESH={version:VERSION,force:forceSync,refresh:autoRefresh};
})();
