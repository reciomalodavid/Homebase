(() => {
  'use strict';

  const VERSION = '1.9.8';
  const STORAGE_KEY = 'homebase_v2_items';
  let syncTimer = null;
  let lastSnapshot = null;
  let toastTimer = null;
  let onlineTimer = null;

  function clone(value){
    try { return structuredClone(value); }
    catch { return JSON.parse(JSON.stringify(value)); }
  }

  function getItems(){
    return Array.isArray(window.state?.items) ? window.state.items : null;
  }

  function saveItems(){
    const items = getItems();
    if (!items) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }

  function ensureSyncBadge(){
    let badge = document.getElementById('homebaseSyncBadge');
    if (badge) return badge;
    const topbar = document.querySelector('.topbar');
    if (!topbar) return null;
    badge = document.createElement('button');
    badge.id = 'homebaseSyncBadge';
    badge.type = 'button';
    badge.className = 'hb-sync-badge';
    badge.setAttribute('aria-label','Estado de sincronización');
    badge.innerHTML = '<span class="hb-sync-dot">✓</span><span class="hb-sync-text">Guardado</span>';
    badge.addEventListener('click', () => {
      if (!navigator.onLine) showOfflineBanner();
    });
    const actions = topbar.querySelector('.top-actions') || topbar.lastElementChild || topbar;
    actions.insertBefore(badge, actions.firstChild);
    return badge;
  }

  function ensureOfflineBanner(){
    let banner = document.getElementById('homebaseOfflineBanner');
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'homebaseOfflineBanner';
    banner.className = 'hb-offline-banner';
    banner.setAttribute('role','status');
    banner.setAttribute('aria-live','polite');
    banner.innerHTML = '<span class="hb-offline-icon">!</span><div><strong>Sin conexión</strong><span>Los cambios se guardan en este dispositivo y se sincronizarán al recuperar internet.</span></div><button type="button" aria-label="Cerrar aviso">×</button>';
    banner.querySelector('button').addEventListener('click', () => banner.classList.remove('show'));
    document.body.appendChild(banner);
    return banner;
  }

  function showOfflineBanner(){
    clearTimeout(onlineTimer);
    const banner = ensureOfflineBanner();
    banner.classList.remove('online');
    banner.querySelector('strong').textContent = 'Sin conexión';
    banner.querySelector('div span').textContent = 'Los cambios se guardan en este dispositivo y se sincronizarán al recuperar internet.';
    banner.classList.add('show');
  }

  function showOnlineBanner(){
    const banner = ensureOfflineBanner();
    banner.classList.add('online','show');
    banner.querySelector('strong').textContent = 'Conexión recuperada';
    banner.querySelector('div span').textContent = 'Homebase volverá a sincronizar los cambios.';
    clearTimeout(onlineTimer);
    onlineTimer = setTimeout(() => banner.classList.remove('show'), 2800);
  }

  function setSyncState(kind, text){
    const badge = ensureSyncBadge();
    if (!badge) return;
    badge.dataset.state = kind;
    const dot = badge.querySelector('.hb-sync-dot');
    const label = badge.querySelector('.hb-sync-text');
    if (dot) dot.textContent = kind === 'offline' ? '!' : kind === 'syncing' ? '↻' : '✓';
    if (label) label.textContent = text;
    if (kind === 'offline') showOfflineBanner();
  }

  function markSyncing(){
    if (!navigator.onLine) return setSyncState('offline','Sin conexión');
    setSyncState('syncing','Guardando');
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => setSyncState('saved','Guardado'), 1400);
  }

  function wrapCloudFunctions(){
    ['writeCloud','scheduleCloudSave'].forEach(name => {
      const fn = window[name];
      if (typeof fn !== 'function' || fn.__hbWrapped) return;
      const wrapped = function(...args){
        markSyncing();
        try {
          const result = fn.apply(this,args);
          if (result && typeof result.then === 'function') {
            result.then(() => setSyncState('saved','Guardado')).catch(() => setSyncState('offline','No guardado'));
          }
          return result;
        } catch (error) {
          setSyncState('offline','No guardado');
          throw error;
        }
      };
      wrapped.__hbWrapped = true;
      window[name] = wrapped;
    });
  }

  function showUndoToast(label){
    let toast = document.getElementById('homebaseUndoToast');
    if (!toast){
      toast = document.createElement('div');
      toast.id = 'homebaseUndoToast';
      toast.className = 'hb-undo-toast';
      toast.innerHTML = '<span class="hb-undo-label"></span><button type="button">Deshacer</button>';
      document.body.appendChild(toast);
      toast.querySelector('button').addEventListener('click', undoLastDelete);
    }
    toast.querySelector('.hb-undo-label').textContent = label || 'Elemento eliminado';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      lastSnapshot = null;
    }, 6000);
  }

  function undoLastDelete(){
    if (!lastSnapshot || !window.state) return;
    window.state.items = clone(lastSnapshot.items);
    saveItems();
    if (typeof window.render === 'function') window.render();
    if (typeof window.writeCloud === 'function') window.writeCloud();
    const toast = document.getElementById('homebaseUndoToast');
    if (toast) toast.classList.remove('show');
    lastSnapshot = null;
  }

  function itemSignature(items){
    return JSON.stringify((items || []).map(item => [item.id, item.deletedAt || null]));
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button,[role="button"]');
    if (!button) return;
    const text = (button.textContent || '').trim().toLowerCase();
    if (!/(^|\s)(borrar|eliminar)(\s|$)/.test(text)) return;
    const items = getItems();
    if (!items) return;
    const before = clone(items);
    const beforeSignature = itemSignature(before);
    setTimeout(() => {
      const after = getItems();
      if (!after || itemSignature(after) === beforeSignature) return;
      lastSnapshot = { items: before, at: Date.now() };
      showUndoToast('Elemento eliminado');
    }, 350);
  }, true);

  function addVersionToMore(){
    const dialogs = [...document.querySelectorAll('dialog[open], .modal')];
    for (const container of dialogs){
      const heading = container.querySelector('h1,h2,.modal-head');
      const text = (heading?.textContent || '').toLowerCase();
      if (!text.includes('más') && !container.textContent?.includes('Perfiles')) continue;
      if (container.querySelector('.hb-version-row')) continue;
      const row = document.createElement('div');
      row.className = 'hb-version-row';
      row.innerHTML = `<span>Versión</span><strong>Homebase ${VERSION}</strong>`;
      const modal = container.querySelector('.modal') || container;
      modal.appendChild(row);
    }
  }

  window.addEventListener('online', () => {
    setSyncState('saved','Conectado');
    showOnlineBanner();
  });
  window.addEventListener('offline', () => setSyncState('offline','Sin conexión'));

  const observer = new MutationObserver(() => {
    ensureSyncBadge();
    addVersionToMore();
    wrapCloudFunctions();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  setInterval(wrapCloudFunctions,1000);
  document.addEventListener('DOMContentLoaded', () => {
    ensureSyncBadge();
    wrapCloudFunctions();
    setSyncState(navigator.onLine ? 'saved' : 'offline', navigator.onLine ? 'Guardado' : 'Sin conexión');
  });
})();
