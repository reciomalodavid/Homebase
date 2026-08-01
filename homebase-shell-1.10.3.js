(() => {
  'use strict';

  let lastY = Math.max(0, window.scrollY || 0);
  let ticking = false;
  let accumulatedDown = 0;
  let accumulatedUp = 0;
  let switching = false;
  let revealTimer = null;
  let hideTimer = null;

  function topbar(){ return document.querySelector('.topbar'); }
  function isHidden(){ const el = topbar(); return !!(el && el.classList.contains('hb-header-hidden')); }

  function clearHeaderTimers(){
    if (revealTimer){ clearTimeout(revealTimer); revealTimer = null; }
    if (hideTimer){ clearTimeout(hideTimer); hideTimer = null; }
  }

  function showHeaderNow(){
    clearHeaderTimers();
    const el = topbar();
    if (el) el.classList.remove('hb-header-hidden');
  }

  function hideHeaderNow(){
    clearHeaderTimers();
    const el = topbar();
    if (el) el.classList.add('hb-header-hidden');
  }

  function scheduleShow(){
    if (!isHidden() || revealTimer) return;
    if (hideTimer){ clearTimeout(hideTimer); hideTimer = null; }
    revealTimer = setTimeout(() => {
      revealTimer = null;
      const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      if (accumulatedUp >= 24 || y <= 8) showHeaderNow();
    }, 105);
  }

  function scheduleHide(){
    if (isHidden() || hideTimer) return;
    if (revealTimer){ clearTimeout(revealTimer); revealTimer = null; }
    hideTimer = setTimeout(() => {
      hideTimer = null;
      const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      if (accumulatedDown >= 22 && y > 58) hideHeaderNow();
    }, 80);
  }

  function update(){
    ticking = false;
    if (switching) return;

    const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    const delta = y - lastY;

    if (y <= 8){
      accumulatedDown = 0;
      accumulatedUp = 0;
      showHeaderNow();
      lastY = y;
      return;
    }

    if (Math.abs(delta) < 1.5){
      lastY = y;
      return;
    }

    if (delta > 0){
      accumulatedDown += delta;
      accumulatedUp = Math.max(0, accumulatedUp - delta * 1.5);
      if (revealTimer){ clearTimeout(revealTimer); revealTimer = null; }
      if (accumulatedDown >= 22 && y > 58) scheduleHide();
    } else {
      accumulatedUp += Math.abs(delta);
      accumulatedDown = Math.max(0, accumulatedDown - Math.abs(delta) * 1.5);
      if (hideTimer){ clearTimeout(hideTimer); hideTimer = null; }
      if (accumulatedUp >= 24) scheduleShow();
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
    clearHeaderTimers();
    const root = document.documentElement;
    root.classList.add('hb-page-switching');
    showHeaderNow();
    accumulatedDown = 0;
    accumulatedUp = 0;
    window.scrollTo({ top:0, left:0, behavior:'auto' });
    lastY = 0;
  }

  function finishPageSwitch(){
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('hb-page-switching');
        switching = false;
        lastY = 0;
        showHeaderNow();
      });
    });
  }

  document.addEventListener('pointerdown', event => {
    if (bottomNavigationTarget(event.target)) beginPageSwitch();
  }, true);

  document.addEventListener('click', event => {
    if (bottomNavigationTarget(event.target)) finishPageSwitch();
  }, true);

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('pageshow', () => {
    lastY = Math.max(0, window.scrollY || 0);
    accumulatedDown = 0;
    accumulatedUp = 0;
    if (lastY <= 8) showHeaderNow();
  });

  const observer = new MutationObserver(() => {
    const el = topbar();
    if (el && !switching && (window.scrollY || 0) <= 8) el.classList.remove('hb-header-hidden');
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
