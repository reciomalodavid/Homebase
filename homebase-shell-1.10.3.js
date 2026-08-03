(() => {
  'use strict';

  let lastY = Math.max(0, window.scrollY || 0);
  let ticking = false;
  let accumulatedDown = 0;
  let accumulatedUp = 0;
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

  function resetForPageSwitch(){
    clearHeaderTimers();
    accumulatedDown = 0;
    accumulatedUp = 0;
    showHeaderNow();
    document.documentElement.classList.add('hb-page-switching');
    window.scrollTo(0,0);
    lastY = 0;

    requestAnimationFrame(() => {
      document.documentElement.classList.remove('hb-page-switching');
    });
  }

  document.addEventListener('pointerdown', event => {
    if (bottomNavigationTarget(event.target)) resetForPageSwitch();
  }, true);

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('pageshow', () => {
    document.documentElement.classList.remove('hb-page-switching');
    lastY = Math.max(0, window.scrollY || 0);
    accumulatedDown = 0;
    accumulatedUp = 0;
    if (lastY <= 8) showHeaderNow();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) document.documentElement.classList.remove('hb-page-switching');
  });
})();

/* Profile photos in the member picker used by New event and New pending. */
(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    #personPicks .member-pick-content{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      min-width:0;
    }
    #personPicks .member-pick-content .avatar{
      width:38px;
      height:38px;
      flex:0 0 38px;
      cursor:inherit;
      font-size:12px;
    }
    #personPicks .member-pick-name{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
  `;
  document.head.appendChild(style);

  function enhanceMemberPicker(){
    if (typeof avatarHtml !== 'function' || typeof esc !== 'function') return;

    document.querySelectorAll('#personPicks .member-pick').forEach(label => {
      const input = label.querySelector('input[name="eventPerson"]');
      const text = label.querySelector('span');
      if (!input || !text) return;

      const name = input.value;
      if (text.dataset.photoEnhanced === name) return;

      text.classList.add('member-pick-content');
      text.innerHTML = `${avatarHtml(name)}<span class="member-pick-name">${esc(name)}</span>`;
      text.dataset.photoEnhanced = name;
    });
  }

  const observer = new MutationObserver(() => requestAnimationFrame(enhanceMemberPicker));
  observer.observe(document.documentElement, { childList:true, subtree:true });

  document.addEventListener('click', event => {
    if (event.target.closest('.new-btn,.fab,[data-open-new],#addEventButton,#addTaskButton')) {
      requestAnimationFrame(() => requestAnimationFrame(enhanceMemberPicker));
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceMemberPicker, { once:true });
  } else {
    enhanceMemberPicker();
  }
})();
