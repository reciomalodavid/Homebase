(()=>{
  'use strict';

  const PROFILE_KEY='homebase_profiles';
  const EXPIRY_KEY='homebase_expiries_v2';
  const MIGRATION_KEY='homebase_profile_ids_v1';

  const norm=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const slug=value=>norm(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'perfil';
  const randomId=()=>`profile-${crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  function deterministicId(profile,index){
    const source=`${profile?.type||'default'}:${slug(profile?.name||`perfil-${index+1}`)}`;
    let hash=2166136261;
    for(let i=0;i<source.length;i++){
      hash^=source.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    return `profile-legacy-${(hash>>>0).toString(16).padStart(8,'0')}`;
  }

  function currentProfiles(){
    try{
      if(typeof PEOPLE!=='undefined'&&Array.isArray(PEOPLE)&&PEOPLE.length)return PEOPLE;
    }catch{}
    try{
      const parsed=JSON.parse(localStorage.getItem(PROFILE_KEY)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch{return []}
  }

  function legacyStableMap(profiles){
    const seen=new Map();
    return profiles.map((profile,index)=>{
      const name=String(profile?.name||`Perfil ${index+1}`).trim();
      const type=profile?.type||'default';
      const base=String(profile?.id||profile?.uuid||`${type}:${slug(name)}`);
      const count=seen.get(base)||0;
      seen.set(base,count+1);
      return {profile,legacyId:count?`${base}:${count+1}`:base,name};
    });
  }

  function persistProfiles(profiles){localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles))}

  function migrateMissingIds(){
    const profiles=currentProfiles();
    if(!profiles.length)return false;
    const map=legacyStableMap(profiles);
    let profileChanged=false;

    map.forEach(({profile},index)=>{
      if(profile.id)return;
      profile.id=profile.uuid||deterministicId(profile,index);
      profileChanged=true;
    });

    let expiries=[];
    try{
      const parsed=JSON.parse(localStorage.getItem(EXPIRY_KEY)||'[]');
      if(Array.isArray(parsed))expiries=parsed;
    }catch{}

    let expiryChanged=false;
    const byLegacy=new Map(map.map(entry=>[entry.legacyId,entry.profile]));
    const byName=new Map();
    for(const entry of map){
      const key=norm(entry.name);
      if(!byName.has(key))byName.set(key,[]);
      byName.get(key).push(entry.profile);
    }

    expiries=expiries.map(item=>{
      let profile=byLegacy.get(String(item?.profileId||''))||null;
      if(!profile&&item?.profileName){
        const matches=byName.get(norm(item.profileName))||[];
        if(matches.length===1)profile=matches[0];
      }
      if(!profile||item.profileId===profile.id)return item;
      expiryChanged=true;
      return {...item,profileId:profile.id,profileName:profile.name,updatedAt:Number(item.updatedAt)||Date.now()};
    });

    if(profileChanged)persistProfiles(profiles);
    if(expiryChanged)localStorage.setItem(EXPIRY_KEY,JSON.stringify(expiries));
    if(profileChanged||expiryChanged)localStorage.setItem(MIGRATION_KEY,'1');
    return profileChanged||expiryChanged;
  }

  function ensureIdsBeforeSave(){
    const profiles=currentProfiles();
    let changed=false;
    for(const profile of profiles){
      if(profile.id)continue;
      profile.id=profile.uuid||randomId();
      changed=true;
    }
    if(changed)persistProfiles(profiles);
    return changed;
  }

  function wrapProfileSave(){
    if(typeof saveProfiles!=='function'||saveProfiles.__homebaseProfileIds)return;
    const original=saveProfiles;
    const wrapped=function(...args){
      ensureIdsBeforeSave();
      return original.apply(this,args);
    };
    wrapped.__homebaseProfileIds=true;
    saveProfiles=wrapped;
  }

  function init(){
    const profiles=currentProfiles();
    if(profiles.some(profile=>!profile?.id))migrateMissingIds();
    wrapProfileSave();
  }

  init();
  window.HOMEBASE_BETA_PROFILE_IDS={version:'3',ensure:ensureIdsBeforeSave};
})();