(() => {
  'use strict';

  let lastY = Math.max(0, window.scrollY || 0);
  let ticking = false;
  let accumulatedDown = 0;
  let accumulatedUp = 0;
  let switching = false;

  function topbar(){ return document.querySelector('.topbar'); }
  function showHeader(){ const el = topbar(); if (el) el.classList.remove('hb-header-hidden'); }
  function hideHeader(){ const el = topbar(); if (el) el.classList.add('hb-header-hidden'); }

  function update(){
    ticking = false;
    if (switching) return;

    const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    const delta = y - lastY;

    if (y <= 12){
      accumulatedDown = 0;
      accumulatedUp = 0;
      showHeader();
      lastY = y;
      return;
    }

    if (delta > 0){
      accumulatedDown += delta;
      accumulatedUp = 0;
      if (y > 34 && accumulatedDown > 7) hideHeader();
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

  function bottomNavigationTarget(target){
    const button = target.closest('.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item,.nav-btn');
    return button && button.closest('.bottom-nav');
  }

  function beginPageSwitch(){
    if (switching) return;
    switching = true;
    const root = document.documentElement;
    root.classList.add('hb-page-switching');
    showHeader();
    accumulatedDown = 0;
    accumulatedUp = 0;

    /* La pantalla anterior queda oculta durante este único cambio de frame.
       Así iOS no enseña el salto del scroll antes de activar la nueva sección. */
    window.scrollTo({ top:0, left:0, behavior:'auto' });
    lastY = 0;
  }

  function finishPageSwitch(){
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('hb-page-switching');
        switching = false;
        lastY = 0;
        showHeader();
      });
    });
  }

  /* pointerdown ocurre antes del click original de la app. Prepara el nuevo estado
     sin mostrar al usuario el recorrido de la página anterior. */
  document.addEventListener('pointerdown', event => {
    if (bottomNavigationTarget(event.target)) beginPageSwitch();
  }, true);

  document.addEventListener('click', event => {
    if (bottomNavigationTarget(event.target)) finishPageSwitch();
  }, true);

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('pageshow', () => {
    lastY = Math.max(0, window.scrollY || 0);
    if (lastY <= 12) showHeader();
  });

  const observer = new MutationObserver(() => {
    const el = topbar();
    if (el && !switching && (window.scrollY || 0) <= 12) el.classList.remove('hb-header-hidden');
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
