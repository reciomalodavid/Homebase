(()=>{
  'use strict';

  const STORAGE_KEY='homebase_expiries_v1';
  const STAMP_KEY='homebase_expiries_updated_at';
  let applyingRemote=false;
  let saveTimer=null;
  let unsubscribe=null;
  let suspended=false;

  function readExpiries(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function readStamp(){ return Number(localStorage.getItem(STAMP_KEY)||0); }
  function syncCode(){ return String(localStorage.getItem('homebase_sync_code')||'').trim(); }

  function db(){
    try{return window.firebase?.firestore?.()||null}catch{return null}
  }

  function docRef(){
    const code=syncCode(),store=db();
    return code&&store?store.collection('homebaseSyncs').doc(code):null;
  }

  function notifyUpdated(source){
    window.dispatchEvent(new CustomEvent('homebase:expiries-updated',{detail:{source}}));
  }

  async function writeExpiries(){
    const ref=docRef();
    if(!ref||applyingRemote||suspended)return;
    const stamp=Math.max(Date.now(),readStamp()+1);
    localStorage.setItem(STAMP_KEY,String(stamp));
    try{
      await ref.set({
        expiries:readExpiries(),
        expiriesVersion:2,
        expiriesUpdatedAt:stamp
      },{merge:true});
    }catch(error){
      console.error('Expiry cloud save',error);
    }
  }

  function scheduleWrite(){
    if(applyingRemote||suspended)return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(writeExpiries,450);
  }

  function applySnapshot(data){
    if(suspended)return;
    const remote=Array.isArray(data?.expiries)?data.expiries:null;
    if(!remote)return;
    const remoteStamp=Number(data.expiriesUpdatedAt||0);
    const localStamp=readStamp();
    if(remoteStamp&&remoteStamp<=localStamp)return;

    applyingRemote=true;
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(remote));
      localStorage.setItem(STAMP_KEY,String(remoteStamp||Date.now()));
    }finally{
      applyingRemote=false;
    }
    notifyUpdated('cloud');
    setTimeout(()=>location.reload(),120);
  }

  function stopListener(){
    clearTimeout(saveTimer);
    saveTimer=null;
    unsubscribe?.();
    unsubscribe=null;
  }

  function startListener(){
    stopListener();
    if(suspended)return;
    const ref=docRef();
    if(!ref)return;
    unsubscribe=ref.onSnapshot(snapshot=>{
      if(snapshot.exists)applySnapshot(snapshot.data()||{});
    },error=>console.error('Expiry cloud listener',error));
  }

  function suspend(){
    suspended=true;
    stopListener();
  }

  function resume({write=false}={}){
    suspended=false;
    startListener();
    if(write)scheduleWrite();
  }

  const originalSetItem=Storage.prototype.setItem;
  if(!originalSetItem.__expiryDirectSyncWrapped){
    const wrappedSetItem=function(key,value){
      const previous=key===STORAGE_KEY?this.getItem(key):null;
      const result=originalSetItem.call(this,key,value);
      if(key===STORAGE_KEY&&previous!==String(value)&&!applyingRemote&&!suspended){
        originalSetItem.call(this,STAMP_KEY,String(Date.now()));
        scheduleWrite();
        notifyUpdated('local');
      }
      if(key==='homebase_sync_code'&&previous!==String(value))setTimeout(startListener,0);
      return result;
    };
    wrappedSetItem.__expiryDirectSyncWrapped=true;
    Storage.prototype.setItem=wrappedSetItem;
  }

  window.addEventListener('online',()=>{if(!suspended){startListener();scheduleWrite()}});
  window.addEventListener('focus',()=>{if(!suspended)startListener()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!suspended)startListener()});

  window.HOMEBASE_EXPIRY_SYNC={suspend,resume,isSuspended:()=>suspended};

  function init(){
    startListener();
    if(readExpiries().length&&!readStamp()){
      localStorage.setItem(STAMP_KEY,String(Date.now()));
      scheduleWrite();
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
