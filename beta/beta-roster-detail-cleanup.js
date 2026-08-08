(()=>{
'use strict';
if(!window.HOMEBASE_BETA)return;

const VERSION='1';
const CODE_MEANINGS={
  O_TZ:'Día libre por mes de part-time',
  O_S:'Día libre no solicitado',
  O_M:'Día libre solicitado',
  O_V:'Día libre antes/después de vacaciones',
  O_FLEX:'Día libre provisional hasta publicación',
  U:'Vacaciones',
  MED_COCKP:'Medical cockpit'
};

function fold(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase()}

function cleanRosterDetail(){
  const grid=document.getElementById('detailGrid');
  const dialog=document.getElementById('detailDialog');
  if(!grid||!dialog?.open)return;

  const rows=[...grid.querySelectorAll('.detail-row')];
  const hasRosterSignals=rows.some(row=>{
    const label=fold(row.querySelector('.detail-label')?.textContent);
    return label==='CODIGO'||label==='C/I'||label==='C/O'||label==='BRIEFING'||label==='DEBRIEFING'||label==='NOCHE FUERA';
  });
  if(!hasRosterSignals)return;

  for(const row of rows){
    const label=fold(row.querySelector('.detail-label')?.textContent);
    if(label==='PRIVACIDAD'){
      row.remove();
      continue;
    }
    if(label==='CODIGO'){
      const value=row.querySelector('.detail-value');
      if(!value)continue;
      const visible=String(value.textContent||'').trim();
      const key=visible.replace(/\s+/g,'_').toUpperCase();
      const meaning=CODE_MEANINGS[key];
      if(meaning&&!value.dataset.betaRosterMeaning){
        value.textContent=`${visible} · ${meaning}`;
        value.dataset.betaRosterMeaning='1';
      }
    }
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
