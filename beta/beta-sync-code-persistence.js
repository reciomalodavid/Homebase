(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='1';
const SYNC='homebase_sync_code';
const PREFIX='homebase_beta2__';
const ANCHOR='homebase_beta2_sync_code_anchor';
let recovering=false;
let unlinkPatched=false;

function raw(){return window.HOMEBASE_BETA_RAW_STORAGE||null}
function readAnchor(){try{return String(raw()?.get?.(ANCHOR)||'')}catch{return ''}}
function writeAnchor(code){code=String(code||'');if(!code)return;try{raw()?.set?.(ANCHOR,code)}catch{}try{raw()?.set?.(PREFIX+SYNC,code)}catch{}}
function clearProtected(){try{raw()?.remove?.(ANCHOR)}catch{}try{raw()?.remove?.(PREFIX+SYNC)}catch{}}
function currentCode(){try{return String(state?.syncCode||localStorage.getItem(SYNC)||readAnchor()||'')}catch{return readAnchor()}}

async function recover(reason='unknown'){
 if(recovering)return false;
 const code=readAnchor();
 if(!code)return false;
 if(state?.syncCode){writeAnchor(state.syncCode);return false;}
 recovering=true;
 try{
  state.syncCode=code;
  try{localStorage.setItem(SYNC,code)}catch{}
  writeAnchor(code);
  if(window.HOMEBASE_BETA_SECURITY?.ensureAuth)await window.HOMEBASE_BETA_SECURITY.ensureAuth();
  try{if(typeof startCloudListener==='function')startCloudListener()}catch{}
  try{if(typeof refreshWhenActive==='function')refreshWhenActive()}catch{}
  try{if(typeof render==='function')render()}catch{}
  console.info('Beta sync code recovered',reason);
  return true;
 }catch(error){console.warn('Beta sync code recovery',reason,error);return false}
 finally{recovering=false}
}

function protectCurrent(){const code=currentCode();if(code)writeAnchor(code)}

function patchUnlink(){
 if(unlinkPatched||typeof unlinkFamilySync!=='function')return false;
 const original=unlinkFamilySync;
 unlinkFamilySync=function(...args){
  const before=currentCode();
  const result=original.apply(this,args);
  if(before&&!state?.syncCode){clearProtected()}
  else protectCurrent();
  return result;
 };
 unlinkPatched=true;
 const btn=document.getElementById('unlinkSync');if(btn)btn.onclick=unlinkFamilySync;
 return true;
}

function install(){
 protectCurrent();
 let tries=0;const bind=()=>{tries++;if(!patchUnlink()&&tries<80)setTimeout(bind,100)};bind();
 setTimeout(()=>recover('startup'),0);
 window.addEventListener('pageshow',()=>setTimeout(()=>{protectCurrent();recover('pageshow')},80));
 window.addEventListener('focus',()=>setTimeout(()=>{protectCurrent();recover('focus')},80));
 window.addEventListener('online',()=>setTimeout(()=>recover('online'),80));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{protectCurrent();recover('visibility')},80)});
 setInterval(()=>{protectCurrent();if(!state?.syncCode)recover('watchdog')},5000);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_SYNC_CODE_PERSISTENCE={version:VERSION,recover,protect:protectCurrent,clear:clearProtected};
})();
