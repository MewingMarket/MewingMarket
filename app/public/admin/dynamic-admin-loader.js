// =========================================================
// DYNAMIC ADMIN LOADER — SAFE MODE 2056 (ULTRA MINIMAL)
// Percorso reale: /app/public/admin/dynamic-admin-loader.js
// Versione PATCHATA: rimosso forceRenderNoStore
// =========================================================

if (window.__DYNAMIC_ADMIN_LOADER_2056__) {
  console.warn("[DYNAMIC ADMIN 2056] dynamic-admin-loader.js già caricato → skip");
} else {
  window.__DYNAMIC_ADMIN_LOADER_2056__ = true;

  (function () {

    // 🔥 FUSIBILE: evita doppia esecuzione
    if (window.__DYNAMIC_ADMIN_ALREADY_RAN__) {
      console.log("⏭️ [DYNAMIC ADMIN 2056] Logica già eseguita → skip completo");
      return;
    }
    window.__DYNAMIC_ADMIN_ALREADY_RAN__ = true;

    console.log("⚡ [DYNAMIC ADMIN 2056] Avvio dynamic-admin-loader (SAFE MODE)");

    // ============================================================
    // 1) ANTI-CACHE
    // ============================================================
    function applyAntiCache() {
      try {
        const tags = [
          { h: "Cache-Control", c: "no-cache, no-store, must-revalidate" },
          { h: "Pragma",        c: "no-cache" },
          { h: "Expires",       c: "0" }
        ];

        tags.forEach(t => {
          const m = document.createElement("meta");
          m.httpEquiv = t.h;
          m.content = t.c;
          document.head.appendChild(m);
        });

        console.log("🟧 [DYNAMIC ADMIN] Anti-cache applicato");
      } catch (e) {
        console.warn("❌ [DYNAMIC ADMIN] Errore anti-cache:", e.message);
      }
    }

    // ============================================================
    // 2) ANTI SERVICE WORKER
    // ============================================================
    function removeServiceWorkers() {
      try {
        console.log("🟧 [DYNAMIC ADMIN] Rimozione service worker + cache HTTP");

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
          });
        }

        if (window.caches) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }

      } catch (e) {
        console.warn("❌ [DYNAMIC ADMIN] Errore anti-service-worker:", e.message);
      }
    }

    // ============================================================
    // 3) MICRO-DELAY (evita race con SUPREMO ADMIN)
    // ============================================================
    function microDelay() {
      return new Promise(r => setTimeout(r, 15));
    }

    // ============================================================
    // ESECUZIONE ORDINATA
    // ============================================================
    (async () => {
      applyAntiCache();
      removeServiceWorkers();
      await microDelay();

      console.log("🟩 [DYNAMIC ADMIN 2056] Completato (ULTRA MINIMAL SAFE)");
    })();

  })();
}
