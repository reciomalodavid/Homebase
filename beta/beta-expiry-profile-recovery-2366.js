(()=>{
  'use strict';

  const PROFILE_KEY='homebase_profiles';
  const EXPIRY_KEY='homebase_expiries_v2';
  const DONE_KEY='homebase_expiry_profile_recovery_2366';
  const BACKUP_PROFILES='homebase_recovery_2366_profiles_before';
  const BACKUP_EXPIRIES='homebase_recovery_2366_expiries_before';

  const norm=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const slug=value=>norm(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'perfil';
  const generated2365=id=>/^profile-legacy-[0-9a-f]{8}$/i.test(String(id||''));

  function readArray(key){
    try{
      const value=JSON.parse(localStorage.getItem(key)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return []}
  }

  function expectedProfiles(raw){
    const seen=new Map();
    return raw.map((profile,index)=>{
      const name=String(profile?.name||`Perfil ${index+1}`).trim();
      const type=profile?.type||'default';
      const keepId=profile?.id&&!generated2365(profile.id)?String(profile.id):'';
      const base=keepId||String(profile?.uuid||`${type}:${slug(name)}`);
      const count=seen.get(base)||0;
      seen.set(base,count+1);
      return {profile,name,stableId:count?`${base}:${count+1}`:base,removeGeneratedId:generated2365(profile?.id)};
    });
  }

  function run(){
    if(localStorage.getItem(DONE_KEY)==='1')return;

    const rawProfilesText=localStorage.getItem(PROFILE_KEY)||'[]';
    const rawExpiriesText=localStorage.getItem(EXPIRY_KEY)||'[]';
    if(localStorage.getItem(BACKUP_PROFILES)==null)localStorage.setItem(BACKUP_PROFILES,rawProfilesText);
    if(localStorage.getItem(BACKUP_EXPIRIES)==null)localStorage.setItem(BACKUP_EXPIRIES,rawExpiriesText);

    const profiles=readArray(PROFILE_KEY);
    const expiries=readArray(EXPIRY_KEY);
    const expected=expectedProfiles(profiles);

    const byName=new Map();
    for(const entry of expected){
      const key=norm(entry.name);
      if(!byName.has(key))byName.set(key,[]);
      byName.get(key).push(entry);
    }

    let profileChanged=false;
    for(const entry of expected){
      if(!entry.removeGeneratedId)continue;
      delete entry.profile.id;
      profileChanged=true;
    }

    let expiryChanged=false;
    const recovered=expiries.map(item=>{
      const matches=byName.get(norm(item?.profileName||''))||[];
      if(matches.length!==1)return item;
      const target=matches[0].stableId;
      if(String(item?.profileId||'')===target)return item;
      expiryChanged=true;
      return {...item,profileId:target};
    });

    if(profileChanged)localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles));
    if(expiryChanged)localStorage.setItem(EXPIRY_KEY,JSON.stringify(recovered));
    localStorage.setItem(DONE_KEY,'1');

    window.HOMEBASE_BETA_EXPIRY_RECOVERY_2366={
      profilesChanged:profileChanged,
      expiriesChanged:expiryChanged,
      expiryCount:expiries.length,
      recoveredCount:recovered.filter((item,index)=>item!==expiries[index]).length
    };
  }

  run();
})();