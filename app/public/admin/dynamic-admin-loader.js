// ==========================================
// DYNAMIC ADMIN LOADER — SAFE MODE (2028.A)
// Anti 499/502 — stabile su Android/Chrome
// ==========================================

// Guardia anti-doppio-caricamento SEMPLICE
if (window.__DYNAMIC_ADMIN_LOADER_2028A__) {
  console.warn("dynamic-admin-loader.js già caricato, skip.");
} else {
  window.__DYNAMIC_ADMIN_LOADER_2028A__ = true;

  (function () {

    const VERSION = "20260412";

    function start() {

      // -------------------------------
      // 1) ANTI-CACHE (DYNAMIC)
      // -------------------------------
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

      // -------------------------------
      // 2) ANTI SERVICE WORKER (DYNAMIC)
      // -------------------------------
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

      // -------------------------------
      // 3) DIAGNOSTICA ADMIN (DISATTIVATA)
      // -------------------------------
      console.log("🟧 SAFE MODE: diagnostica admin DISATTIVATA");
    }

    // ============================================================
    // ESECUZIONE STABILE (ANTI‑499)
    // ============================================================
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(start, 50);   // micro‑delay anti race‑condition Android
      });
    } else {
      setTimeout(start, 50);
    }

  })();
}
