(()=>{
'use strict';

const VERSION='1';
const SOURCE='profile-birthday';
let pendingProfile=null;

const $=id=>document.getElementById(id);
const norm=value=>String(value||'').trim();
const normKey=value=>norm(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const supportsBirthday=type=>type==='person'||type==='pet';
const birthdayTitle=name=>`Cumpleaños de ${norm(name)}`;

function ensureStyles(){
  if($('betaProfileBirthdayStyles'))return;
  const style=document.createElement('style');
  style.id='betaProfileBirthdayStyles';
  style.textContent=`
    #betaProfileBirthDateWrap{display:grid;gap:6px}
    #betaProfileBirthDateWrap[hidden]{display:none!important}
    #betaProfileBirthDateWrap small{color:var(--muted);font-size:12px;line-height:1.35}
    #betaProfileBirthDate{width:100%;min-height:48px;padding:10px 12px;border:1px solid rgba(60,60,67,.18);border-radius:14px;background:#fff;color:var(--text);font:inherit;box-sizing:border-box}
    .beta-profile-birthday-meta{margin-top:4px;color:var(--muted);font-size:12px}
  `;
  document.head.appendChild(style);
}

function ensureField(){
  const form=$('profileForm');
  if(!form)return null;
  let wrap=$('betaProfileBirthDateWrap');
  if(wrap)return wrap;
  wrap=document.createElement('div');
  wrap.id='betaProfileBirthDateWrap';
  wrap.innerHTML=`<label for="betaProfileBirthDate">Fecha de nacimiento</label><input id="betaProfileBirthDate" type="date"><small>Homebase creará el cumpleaños automáticamente cada año.</small>`;
  const color=$('profileColor');
  const actions=form.querySelector('.profile-form-actions');
  if(color?.nextSibling)color.parentNode.insertBefore(wrap,color.nextSibling);
  else if(actions)form.insertBefore(wrap,actions);
  else form.appendChild(wrap);
  return wrap;
}

function currentEditingProfile(){
  const editing=norm($('profileEditingName')?.value);
  try{return Array.isArray(PEOPLE)?PEOPLE.find(p=>p.name===editing):null}catch{return null}
}

function refreshField(){
  const wrap=ensureField();
  if(!wrap)return;
  const type=$('profileType')?.value||'person';
  wrap.hidden=!supportsBirthday(type);
  const input=$('betaProfileBirthDate');
  if(!input)return;
  if(wrap.hidden)input.value='';
}

function fillFieldFromProfile(){
  ensureField();
  const profile=currentEditingProfile();
  const type=$('profileType')?.value||profile?.type||'person';
  const input=$('betaProfileBirthDate');
  if(input)input.value=supportsBirthday(type)?norm(profile?.birthDate):'';
  refreshField();
}

function profileByName(name){
  try{return Array.isArray(PEOPLE)?PEOPLE.find(p=>p.name===name):null}catch{return null}
}

function saveProfilesSafely(){
  try{if(typeof saveProfiles==='function'){saveProfiles(false);return}}catch{}
  try{localStorage.setItem('homebase_profiles',JSON.stringify(PEOPLE));localStorage.setItem('homebase_profiles_updated_at',String(Date.now()))}catch{}
  try{if(typeof scheduleCloudSave==='function')scheduleCloudSave()}catch{}
}

function exactBirthdayMatch(item,name){
  if(!item||item.deletedAt)return false;
  return normKey(item.title)===normKey(birthdayTitle(name));
}

function findBirthdayItem(oldName,newName){
  let items=[];
  try{items=Array.isArray(state?.items)?state.items:[]}catch{}
  const names=[oldName,newName].filter(Boolean);
  let found=items.find(item=>item?.source===SOURCE&&names.some(name=>
    (Array.isArray(item.people)&&item.people.includes(name))||normKey(item.title)===normKey(birthdayTitle(name))
  ));
  if(found)return found;
  for(const name of names){
    found=items.find(item=>exactBirthdayMatch(item,name)&&item.repeat==='yearly');
    if(found)return found;
  }
  return null;
}

function createBirthdayItem(name,birthDate){
  return {
    id:`profile-birthday-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    type:'event',title:birthdayTitle(name),date:birthDate,endDate:birthDate,allDay:true,time:'',endTime:'',
    person:name,people:[name],eventColor:'',category:'Cumpleaños',categoryOther:'',repeat:'yearly',repeatDays:[],repeatUntil:'',
    notes:'',exceptions:[],done:false,completedAt:null,deletedAt:null,source:SOURCE,rosterData:null,updatedAt:Date.now()
  };
}

function syncBirthdayForProfile(oldName,newName,birthDate,type){
  let items=[];
  try{items=Array.isArray(state?.items)?state.items:[]}catch{return}
  let item=findBirthdayItem(oldName,newName);

  if(!supportsBirthday(type)||!birthDate){
    if(item?.source===SOURCE&&!item.deletedAt){item.deletedAt=Date.now();item.updatedAt=Date.now()}
    return;
  }

  if(!item){item=createBirthdayItem(newName,birthDate);items.push(item)}
  else{
    item.type='event';item.title=birthdayTitle(newName);item.date=birthDate;item.endDate=birthDate;item.allDay=true;item.time='';item.endTime='';
    item.person=newName;item.people=[newName];item.category='Cumpleaños';item.categoryOther='';item.repeat='yearly';item.repeatDays=[];item.repeatUntil='';
    item.deletedAt=null;item.source=SOURCE;item.updatedAt=Date.now();
  }
}

function commitPendingProfile(){
  const pending=pendingProfile;pendingProfile=null;
  if(!pending)return;
  const profile=profileByName(pending.newName);
  if(!profile)return;
  if(supportsBirthday(profile.type))profile.birthDate=pending.birthDate||'';
  else delete profile.birthDate;
  syncBirthdayForProfile(pending.oldName,profile.name,profile.birthDate||'',profile.type);
  saveProfilesSafely();
  try{if(typeof save==='function')save();else if(typeof render==='function')render()}catch{}
  try{if(typeof renderProfiles==='function')renderProfiles()}catch{}
}

function captureProfileSubmit(){
  const form=$('profileForm');
  if(!form||form.dataset.betaBirthdaysBound==='1')return;
  form.dataset.betaBirthdaysBound='1';
  form.addEventListener('submit',()=>{
    const oldName=norm($('profileEditingName')?.value);
    const newName=norm($('profileName')?.value);
    const type=$('profileType')?.value||'person';
    const birthDate=supportsBirthday(type)?($('betaProfileBirthDate')?.value||''):'';
    pendingProfile={oldName,newName,type,birthDate};
    setTimeout(commitPendingProfile,0);
  });
}

function enhanceProfileRows(){
  let profiles=[];
  try{profiles=Array.isArray(PEOPLE)?PEOPLE:[]}catch{}
  document.querySelectorAll('#profileList .profile-row').forEach(row=>{
    if(row.querySelector('.beta-profile-birthday-meta'))return;
    const name=norm(row.querySelector('strong')?.textContent);
    const profile=profiles.find(p=>p.name===name);
    if(!profile||!supportsBirthday(profile.type)||!profile.birthDate)return;
    const target=row.querySelector('.profile-kind');
    if(!target)return;
    const meta=document.createElement('div');
    meta.className='beta-profile-birthday-meta';
    try{const d=new Date(`${profile.birthDate}T12:00:00`);meta.textContent=`🎂 ${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long'}).format(d)}`}catch{meta.textContent=`🎂 ${profile.birthDate}`}
    target.insertAdjacentElement('afterend',meta);
  });
}

function bind(){
  ensureStyles();ensureField();captureProfileSubmit();refreshField();enhanceProfileRows();
  $('profileType')?.addEventListener('change',refreshField);
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-edit-profile]'))setTimeout(fillFieldFromProfile,0);
    if(event.target.closest('#addProfileButton'))setTimeout(()=>{const input=$('betaProfileBirthDate');if(input)input.value='';refreshField()},0);
  },true);
  const observer=new MutationObserver(()=>{ensureField();captureProfileSubmit();enhanceProfileRows()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
window.HOMEBASE_BETA_PROFILE_BIRTHDAYS={version:VERSION};
})();
