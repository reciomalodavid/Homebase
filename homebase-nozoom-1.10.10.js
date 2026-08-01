(() => {
  'use strict';

  // iOS puede ignorar parcialmente user-scalable=no en algunos gestos.
  // Este bloqueo solo afecta al zoom; no modifica scroll, formularios ni navegación.
  document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });
  document.addEventListener('gestureend', event => event.preventDefault(), { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();
