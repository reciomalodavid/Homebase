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
        padding:8px 10px calc(8px + env(safe-area-inset-bottom))!important;
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
        min-height:58px!important;
        padding:8px 4px!important;
        touch-action:manipulation!important;
        pointer-events:auto!important;
      }
      .bottom-nav .nav-btn span{pointer-events:none!important}
      .app{padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}
      .event-fab{bottom:calc(92px + env(safe-area-inset-bottom))!important}
    `;
    document.head.appendChild(style);
  }

  function init(){installStyles()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();