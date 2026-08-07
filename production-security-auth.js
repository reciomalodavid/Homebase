(()=>{
  'use strict';

  const VERSION='1';
  let currentUid='';
  let authPromise=null;
  let authorizedUids=[];
  let payloadPatched=false;

  function mergeUid(list,uid){
    const out=[];
    for(const value of Array.isArray(list)?list:[]){
      if(typeof value==='string'&&value&&!out.includes(value))out.push(value);
    }
    if(uid&&!out.includes(uid))out.push(uid);
    return out;
  }

  async function ensureAuth(){
    if(authPromise)return authPromise;
    authPromise=(async()=>{
      if(!window.firebase||typeof firebase.auth!=='function')throw new Error('Firebase Auth no está disponible');
      const auth=firebase.auth();
      let user=auth.currentUser;
      if(!user){
        const result=await auth.signInAnonymously();
        user=result.user;
      }
      if(!user)throw new Error('No se pudo iniciar la sesión segura');
      currentUid=user.uid;
      window.HOMEBASE_AUTH_UID=currentUid;
      patchCloudPayload();
      return user;
    })();
    try{return await authPromise}catch(error){authPromise=null;throw error}
  }

  function patchCloudPayload(){
    if(payloadPatched||typeof cloudPayload!=='function')return;
    const original=cloudPayload;
    cloudPayload=function(){
      const payload=original();
      if(currentUid){
        payload.authorizedUids=mergeUid(authorizedUids,currentUid);
        payload.securityVersion=2;
      }
      return payload;
    };
    payloadPatched=true;
  }

  async function enrollCurrentDevice(){
    const code=String(localStorage.getItem('homebase_sync_code')||'').trim();
    if(!code||!currentUid)return;
    const store=firebase.firestore();
    const ref=store.collection('homebaseSyncs').doc(code);
    try{
      const snap=await ref.get();
      if(snap.exists)authorizedUids=mergeUid((snap.data()||{}).authorizedUids,currentUid);
      else authorizedUids=mergeUid([],currentUid);
      await ref.set({
        authorizedUids:firebase.firestore.FieldValue.arrayUnion(currentUid),
        securityVersion:2,
        securityUpdatedAt:Date.now()
      },{merge:true});
      authorizedUids=mergeUid(authorizedUids,currentUid);
    }catch(error){
      console.warn('Homebase production auth enrollment',error);
      throw error;
    }
  }

  async function start(){
    try{
      await ensureAuth();
      await enrollCurrentDevice();
      window.dispatchEvent(new CustomEvent('homebase:auth-ready',{detail:{uid:currentUid}}));
    }catch(error){
      console.error('Homebase production auth',error);
      window.dispatchEvent(new CustomEvent('homebase:auth-error',{detail:{message:String(error?.message||error)}}));
    }
  }

  window.HOMEBASE_SECURITY={
    version:VERSION,
    ensureAuth,
    enroll:async()=>{await ensureAuth();return enrollCurrentDevice()},
    getUid:()=>currentUid,
    getAuthorizedUids:()=>[...authorizedUids]
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
