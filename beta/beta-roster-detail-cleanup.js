(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='2';
const CODE_MEANINGS={
  O_TZ:'Monthly Part Time day',
  O_S:'Local Day not requested',
  O_M:'Local Day requested',
  O_V:'Local Day vor/nach U',
  O_FLEX:'Local Day Variable off until publish',
  O_FIX:'Local Off Day · Fixed Roster',
  O_L:'Local Day longterm',
  O_RES:'RES Duty changed to OFF',
  O_SUR:'OFF surrender voluntary',
  O_TX:'Local Day 10er Block',
  O_U:'Local day vacation',
  O_NHCA:'LD not at HB acc. CA',
  U:'Vacation',
  MED_COCKP:'Medical Cockpit AT/ES',
  MED_OFF:'Local Day Medical',
  KCC_FLD:'Sick leave flight duties',
  KCC_GND:'Sick leave ground duties',
  KCC_OFF:'Sick leave on free day',
  KCC_SBY:'Sick leave standby',
  KCC_VAC:'Sick leave on vacation',
  KCC:'Sick leave tracking',
  K:'Sick leave assignment',
  REF:'SIM-Refresher',
  FCL:'FCL Check',
  OPC:'OPC',
  CRM:'CRM Recurrent Training',
  SEP:'Safety and Emergency',
  LINE_CK:'Linecheck Trainee',
  LINE_CKTR:'Line Check Trainer',
  STBY:'Standby',
  STBY_AP:'Standby at Airport',
  STBY_RES:'Reserve Duty',
  STBY_S1:'Standby',
  STBY_S3:'Standby',
  STBY_S5:'Standby',
  SBY_RS72:'Reserve Duty 72h',
  RES_24:'Reserve Duty 24h',
  SIM_APT:'SIM Flat Panel Trainer',
  SIM_TR:'SIM-Trainer',
  SIM_TS:'SIM-Trainee',
  TNG_DAY:'Studyday',
  TRAINER:'Trainer Ground',
  WETDRILL:'Wet Drill Training',
  WORKSHOP:'Workshop',
  '1AID':'First Aid'
};

function fold(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase()}
function codeKey(v){return String(v||'').trim().toUpperCase().replace(/[\s-]+/g,'_')}
function currentRosterItem(){
  if(typeof state==='undefined'||!state?.detailId||!Array.isArray(state.items))return null;
  const item=state.items.find(i=>i.id===state.detailId);
  return item?.source==='roster'?item:null;
}
function removeRows(labels){
  const wanted=new Set(labels.map(fold));
  const grid=document.getElementById('detailGrid');
  if(!grid)return;
  for(const row of [...grid.querySelectorAll('.detail-row')]){
    const label=fold(row.querySelector('.detail-label')?.textContent);
    if(wanted.has(label))row.remove();
  }
}
function codeMeaning(value){
  const key=codeKey(value);
  return CODE_MEANINGS[key]||'';
}

function cleanRosterDetail(){
  const grid=document.getElementById('detailGrid');
  const dialog=document.getElementById('detailDialog');
  if(!grid||!dialog?.open)return;
  const item=currentRosterItem();
  if(!item)return;
  const r=item.rosterData||{};
  const kind=String(r.kind||'').toLowerCase();

  for(const row of [...grid.querySelectorAll('.detail-row')]){
    const label=fold(row.querySelector('.detail-label')?.textContent);
    if(label==='PRIVACIDAD'){
      row.remove();
      continue;
    }
    if(label==='CODIGO'){
      const value=row.querySelector('.detail-value');
      if(!value)continue;
      const visible=String(value.textContent||'').split(' · ')[0].trim();
      const meaning=codeMeaning(visible);
      if(meaning){
        value.textContent=`${visible} · ${meaning}`;
        value.dataset.betaRosterMeaning='1';
      }
    }
  }

  if(kind==='off'||kind==='vacation'){
    removeRows(['Horario','Standby previo','Recogida','Briefing','C/I','Trayecto del duty','C/O','Debriefing','Noche fuera']);
  }else if(kind==='standby'){
    removeRows(['Trayecto del duty','Noche fuera']);
    const hasOperationalTime=!!(r.startLocal||r.ciLocal||r.coLocal||item.time||item.endTime);
    if(!hasOperationalTime)removeRows(['Horario']);
  }else if(kind==='training'||kind==='ground'){
    removeRows(['Noche fuera']);
    const hasOperationalTime=!!(r.startLocal||r.ciLocal||r.coLocal||item.time||item.endTime);
    if(!hasOperationalTime)removeRows(['Horario']);
  }
}

function install(){
  const grid=document.getElementById('detailGrid');
  const dialog=document.getElementById('detailDialog');
  if(!grid||!dialog){setTimeout(install,250);return}
  new MutationObserver(()=>setTimeout(cleanRosterDetail,0)).observe(grid,{childList:true,subtree:true,characterData:true});
  dialog.addEventListener('toggle',()=>setTimeout(cleanRosterDetail,0));
  document.addEventListener('click',()=>setTimeout(cleanRosterDetail,0),true);
  setTimeout(cleanRosterDetail,200);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_ROSTER_DETAIL_CLEANUP={version:VERSION,refresh:cleanRosterDetail};
})();
