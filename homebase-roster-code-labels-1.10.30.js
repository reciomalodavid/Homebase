(()=>{
'use strict';

const VERSION='1.10.30';
const CODE_MEANINGS={
  '---':'Duty Ends after 0000 lt',
  ACF:'ACF Trainee',ACF_TR:'ACF Flight Trainer',ANL:'Approved Nursing Leave',
  'ANL-FLD':'ANL - flight duties','ANL-GND':'ANL - ground duties','ANL-OFF':'ANL - on free day','ANL-SBY':'ANL - leave standby','ANL-VAC':'ANL - on vacation',
  'A-SCHUTZ':'CBT employment protection',BR116:'Work Council AT only',BR117:'Work Council AT only',
  CBT:'CBT day',CBT_AVSE:'CBT AVSEC Schulung',CBT_DG:'Dangerous Goods CBT',CBT_GEN:'CBT to link w/h Role',CBT_OFF:'Local Day CBT',CBT_Y:'CBT yearly',
  'C/I':'STBY after C/I',COA:'Coaching Flights',COMOD:'Cabin Manager on Duty',COVID_GEN:'Covid Antigen Testing',COVID_PCR:'Covid PCR Testing',
  CRM:'CRM Recurrent Training',DATSCHUTZ:'Privacy and data protection',DG_FRONT:'Dangerous Goods Classroom',DISP:'Diponible Day OPS DE only',DISP_FIX:'Diponible Day OPS DE only',
  DT:'Office Duty',DT_ACF:'DT ACF',DT_BORD:'Office Duty Bord',DT_COMP:'DT COMP',DT_CRM:'Office Duty CRM-Trainer',DT_FIX:'Non flexible Office Duty',
  DT_INI:'Initial CRM, SEP, FA, etc.',DT_INT:'Office Duty Interview',DT_MEET:'Pilots Meeting/PU Talk',DT_OTH:'Office Duty, not training',DT_PAID:'Office Duty Paid',
  DT_PERS:'Annual Personnel Talk',DT_PR:'Office Duty PR / Presse-Marketing',DT_PREP:'Office Duty (Ausgleichstag TR)',DT_RC:'Office Duty (Auswahl CPT)',DT_REF:'Office Duty Screening and Ref',
  DT_REFLV1:'Office Duty REF Level 1',DT_REFLV2:'Office Duty REF Level 2',DT_REFLV3:'Office Duty REF Level 3',DT_REFLV4:'Office Duty REF Level 4',
  DT_SA:'DT SA Work Council',DT_SEL:'Office Duty Selection',DT_TRNG:'DT TRNG',DT_VAR:'Flexible Office Duty',
  EBT1:'EBT Module 1',EBT2:'EBT Module 2',EBT3:'EBT Module 3',EBT4:'EBT Module 4',EBT5:'EBT Module 5',EBT6:'EBT Module 6',
  EE:'English Evaluation',E_FDV:'Forced FTL Extension',ET:'English Trainer',EZ:'Parental Leave',FCL:'FCL Check',FIN_CKTR:'Final Check Trainer',FIRE_FT:'Fire Fighting',FOMOD:'Flight Manager on Duty',
  FREI:'Flexible day free of duty',GD_GEN:'Ground Duty',GND:'Grounded',HOTAC:'Hotel booking',HOTEL:'Hotel booking at Homebase',HTL_CHG:'Hotel Change',JOKER:'Joker request 4 days block',
  K:'Sick leave assignment',KA:'Short Time Work',KCC:'Sick leave tracking','KCC-FLD':'Sick leave flight duties','KCC-GND':'Sick leave ground duties','KCC-OFF':'Sick leave on free day','KCC-SBY':'Sick leave standby','KCC-VAC':'Sick leave on vacation',
  KND:'Sick leave after duty',KUR:'Medical Rehabilitation',LFT:'LFT — blocked for LFT duties',LINE_CK:'Linecheck Trainee',LINE_CKTR:'Line Check Trainer',
  MED_CABDE:'Medical Cabin Staff DE',MED_CABIN:'Medical Cabin Staff AT/ES',MED_COCDE:'Medical Cockpit DE',MED_COCKP:'Medical Cockpit AT/ES',MED_OFF:'Local Day Medical',
  NA:'Not Available',NA_ERTE:'Leave of Absence ES',NA_V:'Not Available due to vacancy','O_+':'Post granted Duty out an OFF',
  OFF_BEZ:'FD out of local day',OFF_NHOME:'Day OFF not at Homebase',OFF_RN:'Off renunciation',O_FIX:'Local Off Day — Fixed Roster',O_FLEX:'Local Day — Variable off until publish',
  O_L:'Local Day longterm',O_M:'Local Day requested',O_NHCA:'LD not at Homebase acc. CA',OPC:'OPC',O_RES:'RES Duty changed to OFF',O_S:'Local Day not requested',O_SUR:'OFF surrender voluntary',
  O_TX:'Local Day 10er Block',O_TZ:'Monthly Part Time day',O_U:'Local day vacation',O_V:'Local Day before/after vacation',Q:'Quarantine',REF:'SIM-Refresher',RES_24:'Reserve Duty 24h',
  SAFETY_FO:'Safety First Officer',SBTNG:'Standby for trainees','SBY-CLY':'Special SBY CLY','SBY-EWE':'Special SBY EWE','SBY-FNC':'Special SBY FNC','SBY-INN':'Special SBY INN','SBY-JMK':'Special SBY JMK','SBY-ORE':'Special SBY ORE',
  SBY_RS72:'Reserve Duty 72h','SBY-SMI':'Special SBY SMI','SBY-SPC':'Special SBY SPC','SBY-SZG':'Special SBY SZG','SBY-TIV':'Special SBY TIV',SEMINAR:'Seminar',SEP:'Safety and Emergency',
  SIM_APT:'SIM Flat Panel Trainer',SIM_TR:'SIM-Trainer',SIM_TS:'SIM-Trainee',S_LIFUS_A:'Start LIFUS Programme A',STBY:'Standby',STBY_AP:'Standby at Airport','STBY-EWE':'STBY EWE',STBY_RES:'Reserve Duty',
  STBY_S1:'Standby',STBY_S3:'Standby',STBY_S5:'Standby',SU:'Special leave',TK:'Tarif Commission',TK_CABP:'TK CAB DE Paid',TNG_DAY:'Studyday',
  TRAINER:'Trainer Ground',TZ:'Part Time Month',U:'Vacation',UL:'Unpaid leave',UNFIT:'Unfit for planned duty',UNPAID:'Unpaid duty',UU:'Unpaid vacation',V_PT:'VAC consumation in BPT',WETDRILL:'Wet Drill Training',WORKSHOP:'Workshop','1AID':'First Aid'
};

function fold(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase()}
function keyFromVisible(value){return fold(value).replace(/\s+/g,'_')}

function cleanRosterDetail(){
  const grid=document.getElementById('detailGrid');
  const dialog=document.getElementById('detailDialog');
  if(!grid||!dialog?.open)return;
  const rows=[...grid.querySelectorAll('.detail-row')];
  const roster=rows.some(row=>{
    const label=fold(row.querySelector('.detail-label')?.textContent);
    return ['CODIGO','C/I','C/O','BRIEFING','DEBRIEFING','NOCHE FUERA'].includes(label);
  });
  if(!roster)return;

  for(const row of rows){
    const label=fold(row.querySelector('.detail-label')?.textContent);
    if(label==='PRIVACIDAD'){
      row.remove();
      continue;
    }
    if(label==='CODIGO'){
      const value=row.querySelector('.detail-value');
      if(!value||value.dataset.homebaseRosterMeaning)return;
      const visible=String(value.textContent||'').trim();
      const meaning=CODE_MEANINGS[keyFromVisible(visible)]||CODE_MEANINGS[fold(visible)];
      if(meaning){
        value.textContent=`${visible} · ${meaning}`;
        value.dataset.homebaseRosterMeaning='1';
      }
    }
  }
}

function install(){
  const grid=document.getElementById('detailGrid');
  if(!grid){setTimeout(install,250);return}
  new MutationObserver(()=>setTimeout(cleanRosterDetail,0)).observe(grid,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(cleanRosterDetail,0),true);
  setTimeout(cleanRosterDetail,150);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_ROSTER_CODE_LABELS={version:VERSION,codes:CODE_MEANINGS,refresh:cleanRosterDetail};
})();
