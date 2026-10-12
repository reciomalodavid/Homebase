(()=>{
'use strict';
const BACKUP_FORMAT='homebase-production-backup';
const BACKUP_VERSION=2;
const BACKUP_KEYS=[
 'homebase_v2_items',
 'homebase_profiles',
 'homebase_profiles_updated_at',
 'homebase_profile_photos',
 'homebase_roster_visible',
 'homebase_roster_settings',
 'homebase_roster_meta',
 'homebase_sync_code',
 'homebase_expiries_v1',
 'homebase_expiries_updated_at'
];
function storageSnapshot(){
 const storage={};
 for(const key of BACKUP_KEYS)storage[key]=localStorage.getItem(key);
 return storage
}
function snapshot(){
 return {
  format:BACKUP_FORMAT,
  version:BACKUP_VERSION,
  environment:'production',
  createdAt:new Date().toISOString(),
  localStorage:storageSnapshot()
 }
}
function fileName(){
 const d=new Date();
 const pad=n=>String(n).padStart(2,'0');
 return `homebase-v1-export-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`
}
async function download(){
 const button=document.getElementById('homebaseExportV2Button');
 const previous=button?.textContent||'';
 try{
  if(button){button.disabled=true;button.textContent='Preparando archivo…'}
  const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'});
  const file=new File([blob],fileName(),{type:'application/json'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   await navigator.share({files:[file],title:'Copia de Homebase',text:'Archivo para importar en Homebase V2'});
  }else{
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');
   link.href=url;link.download=file.name;link.hidden=true;
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500)
  }
 }catch(error){
  if(error?.name!=='AbortError'){
   console.error('Homebase V2 export',error);
   alert('No se pudo generar el archivo de exportación.')
  }
 }finally{
  if(button){button.disabled=false;button.textContent=previous||'Descargar archivo para Homebase V2'}
 }
}
function install(){
 if(document.getElementById('homebaseExportV2Button'))return true;
 const card=document.getElementById('homebaseBackupCard');
 if(!card)return false;
 const actions=card.querySelector('.hb-backup-actions');
 if(!actions)return false;
 const button=document.createElement('button');
 button.type='button';
 button.id='homebaseExportV2Button';
 button.className='hb-backup-primary';
 button.textContent='Descargar archivo para Homebase V2';
 button.addEventListener('click',download);
 const note=document.createElement('div');
 note.id='homebaseExportV2Note';
 note.className='hb-restore-meta';
 note.style.marginTop='-2px';
 note.textContent='Exporta los datos actuales en un archivo .json para migrarlos a la nueva versión.';
 actions.prepend(note);
 actions.prepend(button);
 return true
}
let tries=0;
const timer=setInterval(()=>{tries++;if(install()||tries>50)clearInterval(timer)},120);
window.addEventListener('pageshow',()=>setTimeout(install,80));
window.HOMEBASE_BACKUP_EXPORT={download,install,snapshot};
})();