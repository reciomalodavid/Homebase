(()=>{
  'use strict';

  function addBackupCard(){
    if(document.getElementById('homebaseBackupCard'))return;
    const pages=[...document.querySelectorAll('.page')];
    const target=pages.find(page=>/Sincronización familiar/i.test(page.textContent||''))||pages.at(-1);
    if(!target)return;

    const card=document.createElement('section');
    card.id='homebaseBackupCard';
    card.className='section';
    card.innerHTML=`
      <div class="section-head"><h2>Copia de seguridad</h2><span>Datos de este dispositivo</span></div>
      <div class="card" style="padding:16px">
        <p style="margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.45">Descarga una copia de todos los datos locales de Homebase sin modificar ni borrar nada.</p>
        <button type="button" id="homebaseBackupButton" style="width:100%;border:0;border-radius:13px;padding:13px;background:var(--accent);color:#fff;font-weight:850">Descargar copia de seguridad</button>
      </div>`;
    target.appendChild(card);
    card.querySelector('#homebaseBackupButton').addEventListener('click',()=>{location.href='./backup.html'});
  }

  function init(){addBackupCard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();