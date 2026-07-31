(() => {
  'use strict';

  let lastY = Math.max(0, window.scrollY || 0);
  let ticking = false;
  let accumulatedDown = 0;
  let accumulatedUp = 0;

  function topbar(){ return document.querySelector('.topbar'); }

  function showHeader(){
    const el = topbar();
    if (el) el.classList.remove('hb-header-hidden');
  }

  function hideHeader(){
    const el = topbar();
    if (el) el.classList.add('hb-header-hidden');
  }

  function scrollPageToTop(){
    showHeader();
    accumulatedDown = 0;
    accumulatedUp = 0;
    lastY = 0;
    window.scrollTo({ top:0, left:0, behavior:'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

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
      if (y > 38 && accumulatedDown > 6) hideHeader();
    } else if (delta < 0){
      accumulatedUp += Math.abs(delta);
      accumulatedDown = 0;
      if (accumulatedUp > 4) showHeader();
    }

    lastY = y;
  }

  function onScroll(){
    if (!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('pageshow', () => {
    lastY = Math.max(0, window.scrollY || 0);
    if (lastY <= 18) showHeader();
  });

  document.addEventListener('click', event => {
    const navItem = event.target.closest('.bottom-nav button,.bottom-nav a,.bottom-nav .nav-item');
    if (!navItem) return;

    scrollPageToTop();
    requestAnimationFrame(scrollPageToTop);
    setTimeout(scrollPageToTop, 70);
    setTimeout(scrollPageToTop, 180);
  }, true);

  const observer = new MutationObserver(() => {
    const el = topbar();
    if (el && (window.scrollY || 0) <= 18) el.classList.remove('hb-header-hidden');
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
