(()=>{
'use strict';

const CURRENT_BUILD=11030;
const CHECK_INTERVAL_MS=60000;
let checking=false;

function installStyles(){
  if(document.getElementById('homebaseUpdateCheckerStyles'))return;
  const style=document.createElement('style');
  style.id='homebaseUpdateCheckerStyles';
  style.textContent=`
    #homebaseUpdateBanner{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(18px);z-index:1400;width:min(92vw,430px);display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(255,255,255,.9);border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 14px 34px rgba(45,94,139,.18);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;color:#182230}
    #homebaseUpdateBanner.open{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
    #homebaseUpdateBanner .copy{min-width:0;flex:1}
    #homebaseUpdateBanner strong{display:block;font-size:14px}
    #homebaseUpdateBanner small{display:block;margin-top:2px;color:#6c7a89;font-size:11px}
    #homebaseUpdateBanner button{border:0;border-radius:12px;background:var(--accent,#d9781f);color:#fff;font-weight:850;padding:10px 13px;white-space:nowrap}
    @media(max-width:767px){#homebaseUpdateBanner{bottom:calc(84px + env(safe-area-inset-bottom))}}
  `;
  document.head.appendChild(style);
}

function ensureBanner(){
  let banner=document.getElementById('homebaseUpdateBanner');
  if(banner)return banner;
  banner=document.createElement('div');
  banner.id='homebaseUpdateBanner';
  banner.innerHTML='<div class="copy"><strong>Actualización disponible</strong><small>Recarga Homebase para usar la versión nueva. Tus datos no se borran.</small></div><button type="button">Recargar</button>';
  banner.querySelector('button').addEventListener('click',()=>{
    const url=new URL('./',location.href);
    url.searchParams.set('update',String(Date.now()));
    location.replace(url.href);
  });
  document.body.appendChild(banner);
  return banner;
}

function showUpdate(){ensureBanner().classList.add('open')}

async function check(){
  if(checking||!navigator.onLine)return;
  checking=true;
  try{
    const response=await fetch(`./homebase-version.json?t=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json();
    if(Number(data?.build||0)>CURRENT_BUILD)showUpdate();
  }catch(error){console.debug('Homebase update check skipped',error)}
  finally{checking=false}
}

function start(){
  installStyles();ensureBanner();check();
  setInterval(check,CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
  window.addEventListener('online',check);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_UPDATE_CHECKER={build:CURRENT_BUILD,check};
})();
