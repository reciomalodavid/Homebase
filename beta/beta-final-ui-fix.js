(()=>{
  'use strict';

  function applyStyles(){
    let style=document.getElementById('hb-beta-final-ui-fix');
    if(!style){
      style=document.createElement('style');
      style.id='hb-beta-final-ui-fix';
      document.head.appendChild(style);
    }
    style.textContent=`
      .bottom-nav{
        position:fixed!important;
        left:0!important;
        right:0!important;
        bottom:5px!important;
        width:100%!important;
        max-width:none!important;
        height:82px!important;
        min-height:82px!important;
        margin:0!important;
        padding:5px 10px 5px!important;
        border-radius:18px 18px 0 0!important;
        transform:none!important;
        -webkit-transform:none!important;
        align-items:stretch!important;
        z-index:10000!important;
      }
      .bottom-nav .nav-btn{
        min-height:70px!important;
        height:70px!important;
        padding:4px 4px 3px!important;
        margin:0!important;
        justify-content:center!important;
      }
      .bottom-nav .nav-btn span{margin-bottom:1px!important}
      .app{padding-bottom:96px!important}
      .event-fab{bottom:91px!important}
    `;
  }

  function init(){applyStyles()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();