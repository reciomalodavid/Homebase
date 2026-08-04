(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  let applyingRemote=false;
  let saveTimer=null;

  function readExpiries(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function same(a,b){
    try{return JSON.stringify(a||[])===JSON.stringify(b||[])}catch{return false}
  }

  function scheduleExpiryCloudSave(){
    if(applyingRemote)return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{
      try{
        if(typeof window.scheduleCloudSave==='function')window.scheduleCloudSave();
        else if(typeof scheduleCloudSave==='function')scheduleCloudSave();
      }catch(error){console.error('Expiry cloud save',error)}
    },350);
  }

  function wrapCloudPayload(){
    const original=window.cloudPayload;
    if(typeof original!=='function'||original.__expirySyncWrapped)return false;
    const wrapped=function(...args){
      const payload=original.apply(this,args)||{};
      return {...payload,expiries:readExpiries(),expiriesVersion:1};
    };
    wrapped.__expirySyncWrapped=true;
    window.cloudPayload=wrapped;
    return true;
  }

  function wrapRemoteApply(){
    const original=window.applyRemotePayload;
    if(typeof original!=='function'||original.__expirySyncWrapped)return false;
    const wrapped=function(data,...args){
      const remote=Array.isArray(data?.expiries)?data.expiries:null;
      const local=readExpiries();
      const changed=remote&&!same(local,remote);
      if(changed){
        applyingRemote=true;
        try{localStorage.setItem(STORAGE_KEY,JSON.stringify(remote))}
        finally{applyingRemote=false}
      }
      const result=original.call(this,data,...args);
      if(changed){
        window.dispatchEvent(new CustomEvent('homebase:expiries-updated',{detail:{source:'cloud'}}));
        setTimeout(()=>location.reload(),80);
      }
      return result;
    };
    wrapped.__expirySyncWrapped=true;
    window.applyRemotePayload=wrapped;
    return true;
  }

  const originalSetItem=Storage.prototype.setItem;
  if(!originalSetItem.__expirySyncWrapped){
    const wrappedSetItem=function(key,value){
      const previous=key===STORAGE_KEY?this.getItem(key):null;
      const result=originalSetItem.call(this,key,value);
      if(key===STORAGE_KEY&&previous!==String(value)&&!applyingRemote){
        scheduleExpiryCloudSave();
        window.dispatchEvent(new CustomEvent('homebase:expiries-updated',{detail:{source:'local'}}));
      }
      return result;
    };
    wrappedSetItem.__expirySyncWrapped=true;
    Storage.prototype.setItem=wrappedSetItem;
  }

  function install(){
    const payloadReady=wrapCloudPayload();
    const remoteReady=wrapRemoteApply();
    if(!payloadReady||!remoteReady)setTimeout(install,250);
  }

  install();
})();
