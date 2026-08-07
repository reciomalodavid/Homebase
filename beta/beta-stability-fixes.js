(()=>{
  'use strict';

  function installStyles(){
    if(document.getElementById('hb-beta-stability-style'))return;
    const style=document.createElement('style');
    style.id='hb-beta-stability-style';
    style.textContent=`
      .bottom-nav{
        position:fixed!important;
        left:0!important;
        right:0!important;
        bottom:0!important;
        transform:none!important;
        -webkit-transform:none!important;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        padding:5px 10px max(7px,env(safe-area-inset-bottom))!important;
        border-radius:0!important;
        border-top:1px solid rgba(60,60,67,.12)!important;
        background:rgba(255,255,255,.94)!important;
        -webkit-backdrop-filter:blur(24px) saturate(170%)!important;
        backdrop-filter:blur(24px) saturate(170%)!important;
        z-index:10000!important;
        pointer-events:auto!important;
        isolation:isolate!important;
      }
      .bottom-nav .nav-btn{
        position:relative!important;
        z-index:2!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        min-height:56px!important;
        padding:5px 4px!important;
        touch-action:manipulation!important;
        pointer-events:auto!important;
      }
      .bottom-nav .nav-btn span{pointer-events:none!important;margin-bottom:2px!important}
      .app{padding-bottom:calc(84px + env(safe-area-inset-bottom))!important}
      .event-fab{bottom:calc(78px + env(safe-area-inset-bottom))!important}
      #morePage .hb-beta-management-section>.section-head{
        margin-bottom:9px!important;
      }
      #morePage .hb-beta-management-section>.section-head h2{
        margin:0!important;
      }
      #openFiltersRow{
        cursor:pointer!important;
      }
      #openFiltersRow .hb-beta-filter-chevron{
        font-size:20px!important;
        color:var(--muted)!important;
        transition:transform .2s ease!important;
      }
      #openFiltersRow[aria-expanded="true"] .hb-beta-filter-chevron{
        transform:rotate(180deg)!important;
      }
      #hbBetaInlineFilters{
        border-top:1px solid var(--line)!important;
        padding:10px 14px 14px!important;
      }
      #hbBetaInlineFilters[hidden]{display:none!important}
      #hbBetaInlineFilters .filter-list{
        margin:0!important;
      }
    `;
    document.head.appendChild(style);
  }

  function installInlineFilters(filtersRow,managementCard){
    if(!filtersRow||!managementCard)return;

    const filterDialog=document.getElementById('filterDialog');
    const filterList=document.getElementById('filterList');
    if(!filterList)return;

    let inline=document.getElementById('hbBetaInlineFilters');
    if(!inline){
      inline=document.createElement('div');
      inline.id='hbBetaInlineFilters';
      inline.hidden=true;
      managementCard.appendChild(inline);
    }

    if(filterList.parentElement!==inline)inline.appendChild(filterList);
    if(filterDialog)filterDialog.hidden=true;

    const meta=filtersRow.querySelector('.event-meta');
    if(meta)meta.textContent='Elegir qué perfiles mostrar';

    const trailing=filtersRow.lastElementChild;
    if(trailing){
      trailing.textContent='⌄';
      trailing.classList.add('hb-beta-filter-chevron');
    }

    filtersRow.setAttribute('role','button');
    filtersRow.setAttribute('tabindex','0');
    filtersRow.setAttribute('aria-expanded','false');
    filtersRow.setAttribute('aria-controls','hbBetaInlineFilters');

    const toggle=()=>{
      const opening=inline.hidden;
      if(opening){
        try{if(typeof window.renderFilters==='function')window.renderFilters()}catch(error){console.error('Homebase Beta filters',error)}
      }
      inline.hidden=!opening;
      filtersRow.setAttribute('aria-expanded',String(opening));
      try{if(opening&&typeof window.bindDynamic==='function')window.bindDynamic()}catch(error){console.error('Homebase Beta filters',error)}
    };

    filtersRow.onclick=event=>{
      event.preventDefault();
      event.stopPropagation();
      toggle();
    };
    filtersRow.onkeydown=event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      toggle();
    };
  }

  function improveMorePage(){
    const morePage=document.getElementById('morePage');
    const filtersRow=document.getElementById('openFiltersRow');
    const profilesRow=document.getElementById('openProfilesRow');
    const trashRow=document.getElementById('openTrashRow');
    const syncSection=document.getElementById('syncSection');
    if(!morePage||!filtersRow||!profilesRow||!trashRow||!syncSection)return;

    const managementSection=filtersRow.closest('.section');
    const managementCard=filtersRow.closest('.card');
    if(!managementSection||!managementCard)return;

    managementSection.classList.add('hb-beta-management-section');

    let heading=managementSection.querySelector(':scope > .section-head');
    if(!heading){
      heading=document.createElement('div');
      heading.className='section-head';
      heading.innerHTML='<h2>Gestión familiar</h2><span></span>';
      managementSection.insertBefore(heading,managementSection.firstChild);
    }else{
      const title=heading.querySelector('h2');
      if(title)title.textContent='Gestión familiar';
    }

    const profileTitle=profilesRow.querySelector('.event-title');
    const profileMeta=profilesRow.querySelector('.event-meta');
    if(profileTitle)profileTitle.textContent='Perfiles y vencimientos';
    if(profileMeta)profileMeta.textContent='Personas, mascotas, vehículos, viviendas y sus vencimientos';

    managementCard.append(profilesRow,trashRow,filtersRow);
    installInlineFilters(filtersRow,managementCard);

    const backupCard=document.getElementById('homebaseBetaBackupCard');
    if(backupCard&&backupCard.parentElement===morePage){
      morePage.insertBefore(syncSection,backupCard);
      morePage.insertBefore(managementSection,syncSection);
    }else{
      morePage.appendChild(syncSection);
      morePage.insertBefore(managementSection,syncSection);
    }
  }

  function init(){
    installStyles();
    improveMorePage();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();