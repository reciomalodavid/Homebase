(()=>{
  'use strict';
  const $=id=>document.getElementById(id);

  function exactDate(value){
    if(!value)return '';
    const d=new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(d);
  }

  function installStyles(){
    if(document.getElementById('hb-beta-stability-style'))return;
    const style=document.createElement('style');
    style.id='hb-beta-stability-style';
    style.textContent=`
      .profile-doc-form [name="profileId"]{display:none!important}
      .profile-doc-form label:has(+ select[name="profileId"]){display:none!important}
      .bottom-nav{
        position:fixed!important;
        left:0!important;right:0!important;bottom:0!important;
        transform:none!important;-webkit-transform:none!important;
        width:100%!important;max-width:none!important;
        margin:0!important;
        padding:8px 10px calc(8px + env(safe-area-inset-bottom))!important;
        border-radius:0!important;
        z-index:10000!important;
        pointer-events:auto!important;
        isolation:isolate!important;
      }
      .bottom-nav::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(255,255,255,.9);border-top:1px solid rgba(60,60,67,.12);-webkit-backdrop-filter:blur(24px) saturate(170%);backdrop-filter:blur(24px) saturate(170%)}
      .bottom-nav .nav-btn{position:relative!important;z-index:2!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;min-height:58px!important;padding:8px 4px!important;touch-action:manipulation!important;pointer-events:auto!important}
      .bottom-nav .nav-btn span{pointer-events:none!important}
      .app{padding-bottom:calc(98px + env(safe-area-inset-bottom))!important}
      .event-fab{bottom:calc(88px + env(safe-area-inset-bottom))!important}
      dialog[open]{z-index:20000!important}
    `;
    document.head.appendChild(style);
  }

  function selectedDate(){return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day||''}
  function addExactDates(){
    const iso=selectedDate();
    const formatted=exactDate(iso);
    if(!formatted)return;
    document.querySelectorAll('#selectedDayPanel .expiry-day-row .expiry-day-meta').forEach(meta=>{
      if(meta.dataset.exactDate===iso)return;
      const parts=meta.textContent.split('·').map(x=>x.trim()).filter(Boolean);
      const clean=parts.filter(part=>!/^\d{1,2}\s+[a-záéíóú]{3,}\s+\d{4}$/i.test(part));
      if(clean.length>=2)meta.textContent=`${clean[0]} · ${formatted} · ${clean.slice(1).join(' · ')}`;
      else meta.textContent=`${clean.join(' · ')} · ${formatted}`;
      meta.dataset.exactDate=iso;
    });
  }

  function hideForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.style.setProperty('display','none','important');
    form.reset?.();
    form.querySelector('.profile-doc-custom')?.setAttribute('hidden','');
  }

  document.addEventListener('click',event=>{
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(!cancel)return;
    event.preventDefault();
    hideForm(cancel.closest('.profile-doc-form'));
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.profile-doc-form');
    if(!form)return;
    [0,60,180].forEach(ms=>setTimeout(()=>{
      const section=form.closest('.profile-docs');
      hideForm(section?.querySelector('.profile-doc-form')||form);
    },ms));
  },false);

  function editorSnapshot(){
    const type=$('itemType')?.value||'event';
    const noDeadline=type==='task'&&$('noDeadline')?.checked;
    const people=[...document.querySelectorAll('[name=eventPerson]:checked')].map(x=>x.value);
    return {type,title:$('titleInput')?.value.trim()||'',date:noDeadline?'':($('startDate')?.value||''),endDate:type==='event'?($('endDate')?.value||$('startDate')?.value||''):(noDeadline?'':($('startDate')?.value||'')),allDay:type==='event'?!!$('allDay')?.checked:false,time:type==='event'&&!$('allDay')?.checked?($('startTime')?.value||''):'',endTime:type==='event'&&!$('allDay')?.checked?($('endTime')?.value||''):'',people:people.length?people:['Familia'],person:people[0]||'Familia',eventColor:type==='event'?(document.querySelector('[name=eventColor]:checked')?.value||'#3a7be0'):'',category:$('category')?.value||'',categoryOther:$('category')?.value==='Otro'?($('categoryOther')?.value.trim()||''):'',repeat:type==='event'?($('repeat')?.value||'none'):'none',repeatDays:type==='event'?[...document.querySelectorAll('[name=repeatDay]:checked')].map(x=>Number(x.value)):[],repeatUntil:type==='event'?($('repeatUntil')?.value||''):'',notes:$('notes')?.value.trim()||''};
  }

  function verifyEditorSave(snapshot){
    if(!snapshot.title)return;
    let items=[];
    try{items=JSON.parse(localStorage.getItem('homebase_v2_items')||'[]')}catch{}
    if(!Array.isArray(items))items=[];
    const exists=items.some(item=>!item.deletedAt&&item.type===snapshot.type&&item.title===snapshot.title&&item.date===snapshot.date);
    if(exists)return;
    const now=Date.now();
    items.push({id:crypto.randomUUID?.()||`${now}-${Math.random()}`,...snapshot,exceptions:[],done:false,completedAt:null,deletedAt:null,updatedAt:now});
    localStorage.setItem('homebase_v2_items',JSON.stringify(items));
    location.reload();
  }

  function installEditorGuard(){
    const editor=$('editorForm');
    if(!editor||editor.dataset.betaSaveGuard==='1')return;
    editor.dataset.betaSaveGuard='1';
    editor.addEventListener('submit',()=>{
      const snapshot=editorSnapshot();
      setTimeout(()=>verifyEditorSave(snapshot),400);
    },true);
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;installStyles();installEditorGuard();addExactDates()});
  }

  function init(){
    installStyles();installEditorGuard();addExactDates();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.addEventListener('homebase:expiries-updated',schedule);
    setInterval(schedule,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();