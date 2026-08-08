(()=>{
'use strict';

const VERSION='1.10.27';
const EXTERNAL_MARKER='__homebase_birthday_external__';

function todayIso(){const d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${d.getFullYear()}-${m}-${day}`}
function normalizeText(v){return String(v||'').trim()}
function isBirthdayLikeTitle(title){return /(^|\b)(cumplea(?:ños|nos)|cumple|aniversario)(\b|\s+de)/i.test(normalizeText(title))}
function birthdayKind(title){return /aniversario/i.test(normalizeText(title))?'Aniversario':'Cumpleaños'}
function buildTitle(name){const clean=normalizeText(name);return isBirthdayLikeTitle(clean)?clean:`Cumpleaños de ${clean}`}
function readProfiles(){
  try{const stored=JSON.parse(localStorage.getItem('homebase_profiles')||'null');if(Array.isArray(stored)&&stored.length)return stored.filter(p=>p&&p.name).map(p=>({name:String(p.name),type:p.type||'person'}))}catch{}
  try{if(typeof PEOPLE!=='undefined'&&Array.isArray(PEOPLE))return PEOPLE.filter(p=>p&&p.name).map(p=>({name:String(p.name),type:p.type||'person'}))}catch{}
  return [];
}
function defaultDate(){try{if(typeof state!=='undefined'&&state&&state.selectedDate)return state.selectedDate}catch{}return todayIso()}
function currentItems(){try{if(typeof state!=='undefined'&&state&&Array.isArray(state.items))return state.items}catch{}try{return JSON.parse(localStorage.getItem('homebase_v2_items')||'[]')||[]}catch{return []}}
function isExternalBirthdayItem(item){return !!item&&isBirthdayLikeTitle(item.title)&&item.categoryOther===EXTERNAL_MARKER}
function externalBirthdayTitles(){return new Set(currentItems().filter(isExternalBirthdayItem).map(item=>normalizeText(item.title)))}

function installStyles(){
  if(document.getElementById('homebaseBirthdayStyles'))return;
  const style=document.createElement('style');style.id='homebaseBirthdayStyles';style.textContent=`
  #homebaseBirthdayDialog{border:0;padding:0;width:min(92vw,520px);border-radius:26px;background:rgba(252,252,253,.98);box-shadow:0 28px 90px rgba(0,0,0,.28)}
  #homebaseBirthdayDialog::backdrop{background:rgba(25,30,38,.34);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
  .homebase-birthday-modal{padding:22px;display:grid;gap:16px}.homebase-birthday-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .homebase-birthday-head h2{margin:0;font-size:27px;letter-spacing:-.6px}.homebase-birthday-close{width:40px;height:40px;border:0;border-radius:50%;background:rgba(118,118,128,.12);font-size:26px;color:var(--text)}
  .homebase-birthday-note{margin:-6px 0 0;color:var(--muted);font-size:13px;line-height:1.4}.homebase-birthday-field{display:grid;gap:7px}.homebase-birthday-field label{margin:0;font-size:13px;font-weight:800}.homebase-birthday-field input,.homebase-birthday-field select{width:100%;min-height:52px;padding:12px 14px;border:1px solid rgba(60,60,67,.15);border-radius:16px;background:#fff;color:var(--text);font-size:17px}
  .homebase-birthday-hint{font-size:12px;color:var(--muted);line-height:1.4}.homebase-birthday-save{min-height:52px;border:0;border-radius:16px;background:var(--accent);color:white;font-weight:850;font-size:17px}.homebase-birthday-detected{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;padding:6px 9px;border-radius:999px;background:rgba(223,118,21,.10);color:var(--accent);font-size:12px;font-weight:800}
  @media(max-width:700px){#homebaseBirthdayDialog{inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important}.homebase-birthday-modal{min-height:100%;padding:calc(20px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));align-content:start}}
  `;document.head.appendChild(style)
}
function buildDialog(){
  if(document.getElementById('homebaseBirthdayDialog'))return document.getElementById('homebaseBirthdayDialog');
  const dialog=document.createElement('dialog');dialog.id='homebaseBirthdayDialog';dialog.innerHTML=`<form class="homebase-birthday-modal" id="homebaseBirthdayForm">
    <div class="homebase-birthday-head"><h2>Nuevo cumpleaños</h2><button class="homebase-birthday-close" type="button" aria-label="Cerrar">×</button></div>
    <p class="homebase-birthday-note">Se guardará como día completo y se repetirá cada año hasta que lo elimines.</p>
    <div class="homebase-birthday-field"><label for="homebaseBirthdayName">Cumpleaños de…</label><input id="homebaseBirthdayName" maxlength="100" required placeholder="Ej. Marta"></div>
    <div class="homebase-birthday-field"><label for="homebaseBirthdayDate">Fecha</label><input id="homebaseBirthdayDate" type="date" required></div>
    <div class="homebase-birthday-field"><label for="homebaseBirthdayProfile">Relacionado con <span style="font-weight:500;color:var(--muted)">(opcional)</span></label><select id="homebaseBirthdayProfile"><option value="">Sin vincular a un perfil</option></select><div class="homebase-birthday-hint">Puedes vincularlo a una persona o mascota que ya exista en Homebase.</div></div>
    <button class="homebase-birthday-save" type="submit">Guardar cumpleaños</button>
  </form>`;
  dialog.querySelector('.homebase-birthday-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.querySelector('#homebaseBirthdayForm').addEventListener('submit',saveBirthday);document.body.appendChild(dialog);return dialog
}
function fillProfiles(){const select=document.getElementById('homebaseBirthdayProfile');if(!select)return;const current=select.value;select.innerHTML='<option value="">Sin vincular a un perfil</option>';for(const p of readProfiles()){if(p.type!=='person'&&p.type!=='pet')continue;const option=document.createElement('option');option.value=p.name;option.textContent=(p.type==='pet'?'🐾 ':'')+p.name;select.appendChild(option)}if([...select.options].some(o=>o.value===current))select.value=current}
function openForm(){installStyles();const dialog=buildDialog();fillProfiles();document.getElementById('homebaseBirthdayName').value='';document.getElementById('homebaseBirthdayDate').value=defaultDate();document.getElementById('homebaseBirthdayProfile').value='';dialog.showModal();setTimeout(()=>document.getElementById('homebaseBirthdayName')?.focus(),50)}
function setPersonSelection(profileName){const picks=[...document.querySelectorAll('#personPicks input[type="checkbox"]')];if(!picks.length)return;for(const input of picks)input.checked=false;let target=null;if(profileName)target=picks.find(input=>input.value===profileName||normalizeText(input.closest('label')?.textContent)===profileName||normalizeText(input.parentElement?.textContent)===profileName);if(!target)target=picks.find(input=>input.value==='Familia'||normalizeText(input.closest('label')?.textContent)==='Familia'||normalizeText(input.parentElement?.textContent)==='Familia')||picks[0];if(target)target.checked=true}
function setSelectByLabel(select,text){if(!select)return false;const target=normalizeText(text).toLowerCase();const option=[...select.options].find(o=>normalizeText(o.textContent).toLowerCase()===target);if(!option)return false;select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));return true}
function saveBirthday(e){
  e.preventDefault();const name=normalizeText(document.getElementById('homebaseBirthdayName')?.value);const date=document.getElementById('homebaseBirthdayDate')?.value||'';const profile=document.getElementById('homebaseBirthdayProfile')?.value||'';if(!name||!date)return;
  const title=buildTitle(name);const dialog=document.getElementById('homebaseBirthdayDialog');dialog?.close();const nativeDialog=document.getElementById('editorDialog');if(nativeDialog)nativeDialog.style.visibility='hidden';
  const opened=window.HOMEBASE_QUICK_ADD?.openNativeEditor?.('event');if(!opened){if(nativeDialog)nativeDialog.style.visibility='';return;}
  setTimeout(()=>{
    const form=document.getElementById('editorForm'),titleInput=document.getElementById('titleInput'),startDate=document.getElementById('startDate'),endDate=document.getElementById('endDate'),allDay=document.getElementById('allDay'),repeat=document.getElementById('repeat'),repeatUntil=document.getElementById('repeatUntil'),category=document.getElementById('category'),categoryOther=document.getElementById('categoryOther'),more=document.getElementById('moreOptions'),advanced=document.getElementById('advanced');
    if(titleInput)titleInput.value=title;if(startDate)startDate.value=date;if(endDate)endDate.value=date;if(allDay&&!allDay.checked)allDay.click();if(more&&advanced&&!advanced.classList.contains('open'))more.click();if(repeat){repeat.value='yearly';repeat.dispatchEvent(new Event('change',{bubbles:true}))}if(repeatUntil)repeatUntil.value='';setSelectByLabel(category,'Cumpleaños');if(categoryOther)categoryOther.value=profile?'':EXTERNAL_MARKER;setPersonSelection(profile);
    if(form){form.requestSubmit();setTimeout(()=>{if(nativeDialog)nativeDialog.style.visibility='';cleanExternalBirthdayPresentation();if(nativeDialog?.open){console.warn('Birthday bridge validation kept native editor open');nativeDialog.style.visibility=''}},140)}else if(nativeDialog)nativeDialog.style.visibility='';
  },70)
}
function cleanExternalBirthdayPresentation(){
  const titles=externalBirthdayTitles();if(!titles.size)return;
  for(const row of document.querySelectorAll('.event-row')){const text=normalizeText(row.textContent);const title=[...titles].find(t=>text.includes(t));if(!title)continue;for(const meta of row.querySelectorAll('.event-meta')){const raw=normalizeText(meta.textContent);if(!raw.includes('Familia'))continue;const cleaned=raw.replace(/^Familia\s*·\s*/i,'').replace(/\s*·\s*Familia$/i,'').replace(/^Familia$/i,'').trim();meta.textContent=cleaned;if(!cleaned)meta.style.display='none'}for(const avatar of row.querySelectorAll('.avatar-stack,.avatar'))avatar.style.display='none'}
  const detail=document.getElementById('detailDialog');if(detail?.open){const title=normalizeText(document.getElementById('detailTitle')?.textContent);if(titles.has(title)){const grid=document.getElementById('detailGrid');if(grid){for(const child of [...grid.children]){const text=normalizeText(child.textContent);if(/^PARA\b/i.test(text)&&/Familia/i.test(text))child.style.display='none'}}}}
}
function enhanceDetectedDetail(){const dialog=document.getElementById('detailDialog');if(!dialog?.open)return;const titleEl=document.getElementById('detailTitle');const title=normalizeText(titleEl?.textContent);if(!titleEl||!isBirthdayLikeTitle(title))return;if(!dialog.querySelector('.homebase-birthday-detected')){const badge=document.createElement('div');badge.className='homebase-birthday-detected';badge.textContent=birthdayKind(title)==='Aniversario'?'💍 Aniversario detectado':'🎂 Cumpleaños detectado';titleEl.insertAdjacentElement('afterend',badge)}cleanExternalBirthdayPresentation()}
function installDetection(){const detail=document.getElementById('detailDialog');if(detail)new MutationObserver(()=>{enhanceDetectedDetail();cleanExternalBirthdayPresentation()}).observe(detail,{attributes:true,subtree:true,childList:true,characterData:true});const app=document.querySelector('.app')||document.body;if(app)new MutationObserver(()=>cleanExternalBirthdayPresentation()).observe(app,{subtree:true,childList:true});document.addEventListener('click',()=>setTimeout(()=>{enhanceDetectedDetail();cleanExternalBirthdayPresentation()},30),true);setTimeout(cleanExternalBirthdayPresentation,250)}
function install(){installStyles();buildDialog();installDetection();document.addEventListener('homebase:open-birthday-form',openForm)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BIRTHDAYS={version:VERSION,open:openForm,isBirthdayLikeTitle};
})();
