(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;
const VERSION='2';

function shortUid(uid){
  const value=String(uid||'');
  if(value.length<=18)return value||'—';
  return `${value.slice(0,10)}…${value.slice(-6)}`;
}

function ensureBox(){
  if(document.getElementById('betaAuthDiagnostics'))return document.getElementById('betaAuthDiagnostics');
  const details=document.querySelector('#syncSection .sync-details');
  if(!details)return null;
  const box=document.createElement('div');
  box.id='betaAuthDiagnostics';
  box.style.cssText='margin:10px 0;padding:11px 12px;border-radius:13px;background:rgba(40,120,210,.06);border:1px solid rgba(40,120,210,.16);font-size:12px;line-height:1.45;color:#334155';
  box.innerHTML='<strong>Diagnóstico Auth Beta</strong><div id="betaAuthDiagUid" style="margin-top:5px">UID: comprobando…</div><div id="betaAuthDiagMembership">Autorización: comprobando…</div><div id="betaAuthDiagActions" style="display:none;margin-top:9px"><button id="betaReauthorizeDevice" type="button" style="border:0;border-radius:10px;padding:8px 10px;background:#6f58c9;color:#fff;font-weight:800">Reautorizar este dispositivo</button></div>';
  details.prepend(box);
  document.getElementById('betaReauthorizeDevice')?.addEventListener('click',()=>{
    const join=document.getElementById('betaJoinDevice');
    if(join){join.click();return;}
    alert('No se encontró el flujo de autorización Beta.');
  });
  return box;
}

function setLine(id,text,color){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=text;
  if(color)el.style.color=color;
}
function showReauthorize(show){
  const actions=document.getElementById('betaAuthDiagActions');
  if(actions)actions.style.display=show?'block':'none';
}

async function run(){
  const box=ensureBox();if(!box)return;
  showReauthorize(false);
  try{
    const authApi=window.HOMEBASE_BETA_SECURITY;
    if(!authApi?.ensureAuth){
      setLine('betaAuthDiagUid','UID: Auth Beta no disponible','#b42318');
      setLine('betaAuthDiagMembership','Autorización: no comprobada','#b42318');
      return;
    }
    const user=await authApi.ensureAuth();
    const uid=String(user?.uid||authApi.getUid?.()||window.HOMEBASE_AUTH_UID||'');
    setLine('betaAuthDiagUid',`UID actual: ${shortUid(uid)}`);
    if(!state?.syncCode){
      setLine('betaAuthDiagMembership','Autorización: sin código familiar','#7c5e10');
      return;
    }
    if(typeof syncDoc!=='function'){
      setLine('betaAuthDiagMembership','Autorización: no se puede comprobar syncDoc','#b42318');
      return;
    }
    try{
      const snap=await syncDoc().get();
      const data=snap.exists?(snap.data()||{}):{};
      const members=Array.isArray(data.authorizedUids)?data.authorizedUids:[];
      if(uid&&members.includes(uid)){
        setLine('betaAuthDiagMembership','Autorización: SÍ · UID incluido en el hogar Beta','#067647');
      }else{
        setLine('betaAuthDiagMembership','Autorización: NO · UID no incluido en el hogar Beta','#b42318');
        showReauthorize(true);
      }
    }catch(error){
      const code=String(error?.code||'');
      if(code==='permission-denied'){
        setLine('betaAuthDiagMembership','Autorización: RECHAZADA por Firestore · este UID no puede leer el hogar','#b42318');
        showReauthorize(true);
      }else setLine('betaAuthDiagMembership',`Autorización: error ${code||String(error?.message||error)}`,'#b42318');
    }
  }catch(error){
    setLine('betaAuthDiagUid',`UID: error ${String(error?.code||error?.message||error)}`,'#b42318');
    setLine('betaAuthDiagMembership','Autorización: no comprobada','#b42318');
  }
}

function install(){setTimeout(run,250)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_AUTH_DIAGNOSTICS={version:VERSION,run};
})();
