// ==========================================
// DYNAMIC ADMIN LOADER — MewingMarket
// Carica tutto ciò che NON è critico:
// - api.js (auto-inject)
// - API READY GATE
// - anti-cache
// - anti-service-worker
// - diagnostica admin
// ==========================================

(function () {

  const VERSION = "20260412";

  // -------------------------------
  // 1) AUTO-INJECT API
  // -------------------------------
  (function ensureApiJs() {
    try {
      const exists = [...document.scripts].some(s => s.src.includes("/api.js"));
      if (!exists) {
        const s = document.createElement("script");
        s.src = "/api.js?v=" + VERSION;
        s.onload = () => document.dispatchEvent(new Event("api-ready"));
        s.onerror = () => document.dispatchEvent(new Event("api-ready"));
        document.head.appendChild(s);
      } else {
        document.dispatchEvent(new Event("api-ready"));
      }
    } catch (e) {
      document.dispatchEvent(new Event("api-ready"));
    }
  })();

  // -------------------------------
  // 2) API READY GATE
  // -------------------------------
  function waitForApiReady(timeoutMs = 8000) {
    return new Promise((resolve) => {
      const start = Date.now();
      function check() {
        if (window.api && typeof window.api === "object") {
          resolve();
          return;
        }
        if (Date.now() - start > timeoutMs) {
          resolve();
          return;
        }
        setTimeout(check, 50);
      }
      check();
    });
  }

  waitForApiReady();

  // -------------------------------
  // 3) ANTI-CACHE
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
  // 4) ANTI SERVICE WORKER
  // -------------------------------
  (function removeServiceWorkers() {
    try {
      if ('serviceWorker' in navigator) {
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
  // 5) DIAGNOSTICA ADMIN
  // -------------------------------
  try {
    const s = document.createElement("script");
    s.src = `/admin/admin-diagnostica.js?v=${VERSION}`;
    document.head.appendChild(s);
  } catch (e) {}

})();
