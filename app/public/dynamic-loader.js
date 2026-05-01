// =========================================================
// DYNAMIC LOADER — SAFE MODE
// Carica SOLO:
// - anti-cache
// - anti-service-worker
// NIENTE diagnostica, NIENTE introspect, NIENTE test API
// =========================================================

(function () {

  const VERSION = "20260412";

  // -------------------------------
  // 1) ANTI-CACHE (DYNAMIC)
  // -------------------------------
  (function ensureNoCacheMeta() {
    try {
      const hasCacheMeta = !!document.querySelector('meta[http-equiv="Cache-Control"]');
      if (!hasCacheMeta) {
        const m1 = document.createElement("meta");
        m1.httpEquiv = "Cache-Control";
        m1.content = "no-cache, no-store, must-revalidate";
        document.head.appendChild(m1);

        const m2 = document.createElement("meta");
        m2.httpEquiv = "Pragma";
        m2.content = "no-cache";
        document.head.appendChild(m2);

        const m3 = document.createElement("meta");
        m3.httpEquiv = "Expires";
        m3.content = "0";
        document.head.appendChild(m3);
      }
    } catch (e) {}
  })();

  // -------------------------------
  // 2) ANTI SERVICE WORKER (DYNAMIC)
  // -------------------------------
  (function removeServiceWorkers() {
    try {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }
      if (window.caches) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    } catch (e) {}
  })();

  // -------------------------------
  // 3) DIAGNOSTICA FRONTEND (DISATTIVATA)
  // -------------------------------
  console.log("🟧 SAFE MODE: diagnostica frontend DISATTIVATA");
  // (Nessun caricamento di frontend-diagnostica.js)

})();
