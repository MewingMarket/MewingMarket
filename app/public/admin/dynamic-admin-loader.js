// =========================================================
// DYNAMIC ADMIN LOADER — SAFE MODE 2055 (ULTRA MINIMAL)
// Percorso reale: /app/public/admin/dynamic-admin-loader.js
// Scopo: garantire che TUTTI i JS successivi siano freschi
// =========================================================

if (window.__DYNAMIC_ADMIN_LOADER_2055__) {
  console.warn("[DYNAMIC ADMIN 2055] dynamic-admin-loader.js già caricato → skip");
} else {
  window.__DYNAMIC_ADMIN_LOADER_2055__ = true;

  (function () {

    console.log("⚡ [DYNAMIC ADMIN 2055] Avvio dynamic-admin-loader (ULTRA MINIMAL)");

    // ============================================================
    // 1) ANTI-CACHE — impone al browser di NON fidarsi mai
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
    // 2) ANTI SERVICE WORKER — elimina ogni possibile interferenza
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
    // 3) RENDER = FONTE UNICA DI VERITÀ
    // Forza tutti gli script a bypassare la cache
    // ============================================================
    function forceRenderNoStore() {
      try {
        const scripts = document.querySelectorAll("script[src]");
        scripts.forEach(s => {
          const url = new URL(s.src);
          url.searchParams.set("cache", "no-store");
          s.src = url.toString();
        });

        console.log("🟦 [DYNAMIC ADMIN] Render impostato come fonte unica di verità");
      } catch (e) {
        console.warn("❌ [DYNAMIC ADMIN] Errore no-store:", e.message);
      }
    }

    // ============================================================
    // ESECUZIONE ORDINATA (JAVA-MODE)
    // ============================================================
    applyAntiCache();
    removeServiceWorkers();
    forceRenderNoStore();

    console.log("🟩 [DYNAMIC ADMIN 2055] Completato (ULTRA MINIMAL)");

  })();
}
