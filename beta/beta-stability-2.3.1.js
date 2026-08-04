(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const fmtDate=value=>{
    if(!value)return '';
    const d=new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(d);
  };

  function addStyles(){
    if(document.getElementById('hb-beta-stability-style'))return;
    const s=document.createElement('style');
    s.id='hb-beta-stability-style';
    s.textContent=`
      .bottom-nav{
        position:fixed!important;
        left:0!important;right:0!important;bottom:0!important;
        transform:none!important;
        width:100%!important;max-width:none!important;
        margin:0!important;
        padding:8px 10px calc(8px + env(safe-area-inset-bottom))!important;
        z-index:10000!important;
        pointer-events:auto!important;
        border-radius:0!important;
      }
      .bottom-nav::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(24px) saturate(170%);backdrop-filter:blur(24px) saturate(170%);border-top:1px solid rgba(60,60,67,.12)}
      .bottom-nav .nav-btn{position:relative;z-index:2;min-height:58px;touch-action:manipulation;pointer-events:auto!important}
      .app{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}
      .event-fab{bottom:calc(82px + env(safe-area-inset-bottom))!important}
    `;
    document.head.appendChild(s);
  }

  function selectedIso(){return document.querySelector('#monthGrid .day.selected[data-day]')?.dataset.day||''}
  function decorateExpiryDates(){
    const iso=selectedIso();
    const exact=fmtDate(iso);
    if(!exact)return;
    document.querySelectorAll('#selectedDayPanel .expiry-day-row .expiry-day-meta').forEach(meta=>{
      if(meta.dataset.exactDate===iso)return;
      const parts=meta.textContent.split('·').map(x=>x.trim()).filter(Boolean);
      const withoutOld=parts.filter(part=>!/^\d{1,2}\s+[a-záéíóú]{3,}\s+\d{4}$/i.test(part));
      if(withoutOld.length>=2)meta.textContent=`${withoutOld[0]} · ${exact} · ${withoutOld.slice(1).join(' · ')}`;
      else meta.textContent=`${withoutOld.join(' · ')} · ${exact}`;
      meta.dataset.exactDate=iso;
    });
  }

  function hideDocForm(form){
    if(!form)return;
    form.classList.remove('open');
    form.style.setProperty('display','none','important');
    form.reset?.();
  }

  document.addEventListener('click',event=>{
    const cancel=event.target.closest?.('.profile-doc-cancel');
    if(cancel){
      event.preventDefault();
      event.stopPropagation();
      hideDocForm(cancel.closest('.profile-doc-form'));
    }
  },true);

  document.addEventListener('submit',event=>{
    const docForm=event.target.closest?.('.profile-doc-form');
    if(docForm){
      [0,50,180].forEach(ms=>setTimeout(()=>hideDocForm(docForm.closest('.profile-docs')?.querySelector('.profile-doc-form')||docForm),ms));
    }
  },false);

  function editorSnapshot(){
    const type=$('itemType')?.value||'event';
    const noDeadline=type==='task'&&$('noDeadline')?.checked;
    const people=[...document.querySelectorAll('[name=eventPerson]:checked')].map(x=>x.value);
    return {
      type,
      title:$('titleInput')?.value.trim()||'',
      date:noDeadline?'':($('startDate')?.value||''),
      endDate:type==='event'?($('endDate')?.value||$('startDate')?.value||''):(noDeadline?'':($('startDate')?.value||'')),
      allDay:type==='event'?!!$('allDay')?.checked:false,
      time:type==='event'&&!$('allDay')?.checked?($('startTime')?.value||''):'',
      endTime:type==='event'&&!$('allDay')?.checked?($('endTime')?.value||''):'',
      people:people.length?people:['Familia'],
      person:people[0]||'Familia',
      eventColor:type==='event'?(document.querySelector('[name=eventColor]:checked')?.value||'#3a7be0'):'',
      category:$('category')?.value||'',
      categoryOther:$('category')?.value==='Otro'?($('categoryOther')?.value.trim()||''):'',
      repeat:type==='event'?($('repeat')?.value||'none'):'none',
      repeatDays:type==='event'?[...document.querySelectorAll('[name=repeatDay]:checked')].map(x=>Number(x.value)):[],
      repeatUntil:type==='event'?($('repeatUntil')?.value||''):'',
      notes:$('notes')?.value.trim()||''
    };
  }

  function ensureEditorSaved(snapshot){
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

  const editor=$('editorForm');
  if(editor){
    editor.addEventListener('submit',()=>{
      const snapshot=editorSnapshot();
      setTimeout(()=>ensureEditorSaved(snapshot),350);
    },true);
  }

  let scheduled=false;
  const refresh=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorateExpiryDates()});
  };

  function init(){
    addStyles();
    refresh();
    new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.querySelector('.bottom-nav')?.addEventListener('pointerdown',e=>e.stopPropagation(),false);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();