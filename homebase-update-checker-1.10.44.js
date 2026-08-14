(()=>{
'use strict';
const CURRENT_BUILD=11052;
const CHECK_INTERVAL_MS=60000;
let checking=false;
function ensureBanner(){let banner=document.getElementById('homebaseUpdateBanner');if(banner)return banner;banner=document.createElement('div');banner.id='homebaseUpdateBanner';banner.style.cssText='position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:1400;width:min(92vw,430px);display:none;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(255,255,255,.9);border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 14px 34px rgba(45,94,139,.18);color:#182230';banner.innerHTML='<div style="min-width:0;flex:1"><strong style="display:block;font-size:14px">Actualización disponible</strong><small style="display:block;margin-top:2px;color:#6c7a89;font-size:11px">Recarga Homebase para usar la versión nueva. Tus datos no se borran.</small></div><button type="button" style="border:0;border-radius:12px;background:var(--accent,#d9781f);color:#fff;font-weight:850;padding:10px 13px">Recargar</button>';banner.querySelector('button').addEventListener('click',()=>{const url=new URL('./',location.href);url.searchParams.set('update',String(Date.now()));location.replace(url.href)});document.body.appendChild(banner);return banner}
function showUpdate(){ensureBanner().style.display='flex'}
async function check(){if(checking||!navigator.onLine)return;checking=true;try{const response=await fetch(`./homebase-version.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(Number(data?.build||0)>CURRENT_BUILD)showUpdate()}catch(error){console.debug('Homebase update check skipped',error)}finally{checking=false}}
function start(){ensureBanner();check();setInterval(check,CHECK_INTERVAL_MS);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});window.addEventListener('online',check)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_UPDATE_CHECKER={build:CURRENT_BUILD,check};
})();