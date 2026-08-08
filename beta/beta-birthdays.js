(()=>{
'use strict';

const VERSION='1';
const EXTERNAL_MARKER='__homebase_birthday_external__';

function todayIso(){
  const d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function normalizeText(v){return String(v||'').trim()}
function isBirthdayLikeTitle(title){return /(^|\b)(cumplea(?:ños|nos)|cumple|aniversario)(\b|\s+de)/i.test(normalizeText(title))}
function birthdayKind(title){return /aniversario/i.test(normalizeText(title))?'Aniversario':'Cumpleaños'}
function buildTitle(name){
  const clean=normalizeText(name);
  if(isBirthdayLikeTitle(clean))return clean;
  return `Cumpleaños de ${clean}`;
}
function readProfiles(){
  try{
    const stored=JSON.parse(localStorage.getItem('homebase_profiles')||'null');
    if(Array.isArray(stored)&&stored.length)return stored.filter(p=>p&&p.name).map(p=>({name:String(p.name),type:p.type||'person'}));
  }catch{}
  try{
    if(typeof PEOPLE!=='undefined'&&Array.isArray(PEOPLE))return PEOPLE.filter(p=>p&&p.name).map(p=>({name:String(p.name),type:p.type||'person'}));
  }catch{}
  return [];
}
function defaultDate(){
  try{if(typeof state!=='undefined'&&state&&state.selectedDate)return state.selectedDate}catch{}
  return todayIso();
}

function installStyles(){
  if(document.getElementById('betaBirthdayStyles'))return;
  const style=document.createElement('style');
  style.id='betaBirthdayStyles';
  style.textContent=`
  #betaBirthdayDialog{border:0;padding:0;width:min(92vw,520px);border-radius:26px;background:rgba(252,252,253,.98);box-shadow:0 28px 90px rgba(0,0,0,.28)}
  #betaBirthdayDialog::backdrop{background:rgba(25,30,38,.34);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
  .beta-birthday-modal{padding:22px;display:grid;gap:16px}
  .beta-birthday-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .beta-birthday-head h2{margin:0;font-size:27px;letter-spacing:-.6px}.beta-birthday-close{width:40px;height:40px;border:0;border-radius:50%;background:rgba(118,118,128,.12);font-size:26px;color:var(--text)}
  .beta-birthday-note{margin:-6px 0 0;color:var(--muted);font-size:13px;line-height:1.4}
  .beta-birthday-field{display:grid;gap:7px}.beta-birthday-field label{margin:0;font-size:13px;font-weight:800}.beta-birthday-field input,.beta-birthday-field select{width:100%;min-height:52px;padding:12px 14px;border:1px solid rgba(60,60,67,.15);border-radius:16px;background:#fff;color:var(--text);font-size:17px}
  .beta-birthday-hint{font-size:12px;color:var(--muted);line-height:1.4}.beta-birthday-save{min-height:52px;border:0;border-radius:16px;background:var(--accent);color:white;font-weight:850;font-size:17px}
  .beta-birthday-detected{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;padding:6px 9px;border-radius:999px;background:rgba(223,118,21,.10);color:var(--accent);font-size:12px;font-weight:800}
  @media(max-width:700px){#betaBirthdayDialog{inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important}.beta-birthday-modal{min-height:100%;padding:calc(20px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));align-content:start}}
  `;
  document.head.appendChild(style);
}

function buildDialog(){
  if(document.getElementById('betaBirthdayDialog'))return document.getElementById('betaBirthdayDialog');
  const dialog=document.createElement('dialog');
  dialog.id='betaBirthdayDialog';
  dialog.innerHTML=`<form class="beta-birthday-modal" id="betaBirthdayForm">
    <div class="beta-birthday-head"><h2>Nuevo cumpleaños</h2><button class="beta-birthday-close" type="button" aria-label="Cerrar">×</button></div>
    <p class="beta-birthday-note">Se guardará como día completo y se repetirá cada año hasta que lo elimines.</p>
    <div class="beta-birthday-field"><label for="betaBirthdayName">Cumpleaños de…</label><input id="betaBirthdayName" maxlength="100" required placeholder="Ej. Marta"></div>
    <div class="beta-birthday-field"><label for="betaBirthdayDate">Fecha</label><input id="betaBirthdayDate" type="date" required></div>
    <div class="beta-birthday-field"><label for="betaBirthdayProfile">Relacionado con <span style="font-weight:500;color:var(--muted)">(opcional)</span></label><select id="betaBirthdayProfile"><option value="">Persona externa / sin perfil</option></select><div class="beta-birthday-hint">Elige un perfil solo si esa persona ya existe en Homebase.</div></div>
    <button class="beta-birthday-save" type="submit">Guardar cumpleaños</button>
  </form>`;
  dialog.querySelector('.beta-birthday-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.querySelector('#betaBirthdayForm').addEventListener('submit',saveBirthday);
  document.body.appendChild(dialog);
  return dialog;
}

function fillProfiles(){
  const select=document.getElementById('betaBirthdayProfile');
  if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">Persona externa / sin perfil</option>';
  for(const p of readProfiles()){
    if(p.type&&p.type!=='person')continue;
    const option=document.createElement('option');
    option.value=p.name;option.textContent=p.name;select.appendChild(option);
  }
  if([...select.options].some(o=>o.value===current))select.value=current;
}

function openForm(){
  installStyles();
  const dialog=buildDialog();
  fillProfiles();
  document.getElementById('betaBirthdayName').value='';
  document.getElementById('betaBirthdayDate').value=defaultDate();
  document.getElementById('betaBirthdayProfile').value='';
  dialog.showModal();
  setTimeout(()=>document.getElementById('betaBirthdayName')?.focus(),50);
}

function setPersonSelection(profileName){
  const picks=[...document.querySelectorAll('#personPicks input[type="checkbox"]')];
  if(!picks.length)return;
  for(const input of picks)input.checked=false;
  let target=null;
  if(profileName){
    target=picks.find(input=>input.value===profileName||normalizeText(input.closest('label')?.textContent)===profileName||normalizeText(input.parentElement?.textContent)===profileName);
  }
  if(!target){
    target=picks.find(input=>input.value==='Familia'||normalizeText(input.closest('label')?.textContent)==='Familia'||normalizeText(input.parentElement?.textContent)==='Familia')||picks[0];
  }
  if(target)target.checked=true;
}

function setSelectByLabel(select,text){
  if(!select)return false;
  const target=normalizeText(text).toLowerCase();
  const option=[...select.options].find(o=>normalizeText(o.textContent).toLowerCase()===target);
  if(!option)return false;
  select.value=option.value;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

function saveBirthday(e){
  e.preventDefault();
  const name=normalizeText(document.getElementById('betaBirthdayName')?.value);
  const date=document.getElementById('betaBirthdayDate')?.value||'';
  const profile=document.getElementById('betaBirthdayProfile')?.value||'';
  if(!name||!date)return;

  const title=buildTitle(name);
  const dialog=document.getElementById('betaBirthdayDialog');
  dialog?.close();
  const nativeDialog=document.getElementById('editorDialog');
  if(nativeDialog)nativeDialog.style.visibility='hidden';

  const opened=window.HOMEBASE_BETA_QUICK_ADD?.openNativeEditor?.('event');
  if(!opened){if(nativeDialog)nativeDialog.style.visibility='';return;}

  setTimeout(()=>{
    const form=document.getElementById('editorForm');
    const titleInput=document.getElementById('titleInput');
    const startDate=document.getElementById('startDate');
    const endDate=document.getElementById('endDate');
    const allDay=document.getElementById('allDay');
    const repeat=document.getElementById('repeat');
    const repeatUntil=document.getElementById('repeatUntil');
    const category=document.getElementById('category');
    const categoryOther=document.getElementById('categoryOther');
    const more=document.getElementById('moreOptions');
    const advanced=document.getElementById('advanced');

    if(titleInput)titleInput.value=title;
    if(startDate)startDate.value=date;
    if(endDate)endDate.value=date;
    if(allDay&&!allDay.checked)allDay.click();
    if(more&&advanced&&!advanced.classList.contains('open'))more.click();
    if(repeat){repeat.value='yearly';repeat.dispatchEvent(new Event('change',{bubbles:true}));}
    if(repeatUntil)repeatUntil.value='';
    setSelectByLabel(category,'Cumpleaños');
    if(categoryOther)categoryOther.value=profile?'':EXTERNAL_MARKER;
    setPersonSelection(profile);

    if(form){
      form.requestSubmit();
      setTimeout(()=>{
        if(nativeDialog)nativeDialog.style.visibility='';
        if(nativeDialog?.open){
          console.warn('Birthday bridge validation kept native editor open');
          nativeDialog.style.visibility='';
        }
      },120);
    }else if(nativeDialog){nativeDialog.style.visibility='';}
  },70);
}

function enhanceDetectedDetail(){
  const dialog=document.getElementById('detailDialog');
  if(!dialog?.open)return;
  const titleEl=document.getElementById('detailTitle');
  const title=normalizeText(titleEl?.textContent);
  if(!titleEl||!isBirthdayLikeTitle(title))return;
  if(!dialog.querySelector('.beta-birthday-detected')){
    const badge=document.createElement('div');
    badge.className='beta-birthday-detected';
    badge.textContent=birthdayKind(title)==='Aniversario'?'💍 Aniversario detectado':'🎂 Cumpleaños detectado';
    titleEl.insertAdjacentElement('afterend',badge);
  }
}

function installDetection(){
  const detail=document.getElementById('detailDialog');
  if(detail)new MutationObserver(enhanceDetectedDetail).observe(detail,{attributes:true,subtree:true,childList:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(enhanceDetectedDetail,20),true);
}

function install(){
  installStyles();buildDialog();installDetection();
  document.addEventListener('homebase:open-birthday-form',openForm);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_BETA_BIRTHDAYS={version:VERSION,open:openForm,isBirthdayLikeTitle};
})();
