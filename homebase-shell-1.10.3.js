(() => {
  'use strict';

  let lastY = Math.max(0, window.scrollY || 0);
  let ticking = false;
  let accumulatedDown = 0;
  let accumulatedUp = 0;

  function topbar(){ return document.querySelector('.topbar'); }
  function showHeader(){ const el = topbar(); if (el) el.classList.remove('hb-header-hidden'); }
  function hideHeader(){ const el = topbar(); if (el) el.classList.add('hb-header-hidden'); }

  function update(){
    ticking = false;
    const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    const delta = y - lastY;

    if (y <= 18){
      accumulatedDown = 0;
      accumulatedUp = 0;
      showHeader();
      lastY = y;
      return;
    }

    if (delta > 0){
      accumulatedDown += delta;
      accumulatedUp = 0;
      if (y > 46 && accumulatedDown > 8) hideHeader();
    } else if (delta < 0){
      accumulatedUp += Math.abs(delta);
      accumulatedDown = 0;
      if (accumulatedUp > 5) showHeader();
    }
    lastY = y;
  }

  function onScroll(){
    if (!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function isBottomNavigationTarget(target){
    const button = target.closest('.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item,.nav-btn');
    return button && button.closest('.bottom-nav');
  }

  function preparePageSwitch(){
    const root = document.documentElement;
    root.classList.add('hb-page-switching');
    showHeader();
    accumulatedDown = 0;
    accumulatedUp = 0;
    window.scrollTo(0,0);
    lastY = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('hb-page-switching')));
  }

  /* Se ejecuta antes del manejador original de navegación. El cambio de scroll y de página
     ocurre dentro del mismo frame, evitando el salto visible posterior. */
  document.addEventListener('click', event => {
    if (isBottomNavigationTarget(event.target)) preparePageSwitch();
  }, true);

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('pageshow', () => {
    lastY = Math.max(0, window.scrollY || 0);
    if (lastY <= 18) showHeader();
  });

  const observer = new MutationObserver(() => {
    const el = topbar();
    if (el && (window.scrollY || 0) <= 18) el.classList.remove('hb-header-hidden');
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
