(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const CURRENT_BUILD=2400;
const CHECK_INTERVAL_MS=60000;
let timer=null;
let checking=false;

function installStyles(){
  if(document.getElementById('betaUpdateCheckerStyles'))return;
  const style=document.createElement('style');
  style.id='betaUpdateCheckerStyles';
  style.textContent=`
    #betaUpdateBanner{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(18px);z-index:1400;width:min(92vw,430px);display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(255,255,255,.9);border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 14px 34px rgba(45,94,139,.18);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;color:#182230}
    #betaUpdateBanner.open{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
    #betaUpdateBanner .copy{min-width:0;flex:1}
    #betaUpdateBanner strong{display:block;font-size:14px}
    #betaUpdateBanner small{display:block;margin-top:2px;color:#6c7a89;font-size:11px}
    #betaUpdateBanner button{border:0;border-radius:12px;background:#6f58c9;color:white;font-weight:850;padding:10px 13px;white-space:nowrap}
    @media(max-width:767px){#betaUpdateBanner{bottom:calc(84px + env(safe-area-inset-bottom))}}
  `;
  document.head.appendChild(style);
}
function ensureBanner(){
  let banner=document.getElementById('betaUpdateBanner');if(banner)return banner;
  banner=document.createElement('div');banner.id='betaUpdateBanner';
  banner.innerHTML='<div class="copy"><strong>Actualización disponible</strong><small>Recarga Beta para usar la versión nueva. Tus datos no se borran.</small></div><button type="button">Recargar</button>';
  banner.querySelector('button').addEventListener('click',()=>{
    const url=new URL('./beta/app-2.3.html',location.origin+location.pathname.replace(/beta\/.*$/,''));
    url.searchParams.set('update',String(Date.now()));
    location.replace(url.href);
  });
  document.body.appendChild(banner);return banner;
}
function showUpdate(){ensureBanner().classList.add('open')}
function hideUpdate(){ensureBanner().classList.remove('open')}
async function check(){
  if(checking||!navigator.onLine)return;checking=true;
  try{
    const response=await fetch(`./beta/version.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;
    const data=await response.json();
    const remoteBuild=Number(data?.build||0);
    const loadedBuild=Number(window.HOMEBASE_BETA_LOADED_BUILD||CURRENT_BUILD);
    if(remoteBuild>loadedBuild)showUpdate();else hideUpdate();
  }catch(error){console.debug('Beta update check skipped',error)}finally{checking=false}
}
function start(){installStyles();ensureBanner();check();timer=setInterval(check,CHECK_INTERVAL_MS);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});window.addEventListener('online',check)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.HOMEBASE_BETA_UPDATE_CHECKER={build:CURRENT_BUILD,check};
})();