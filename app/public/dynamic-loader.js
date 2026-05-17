// =========================================================
// DYNAMIC LOADER — SAFE MODE 2056 (ULTRA MINIMAL PUBLIC)
// Patch 2056: aggiunto critical-ready + micro-delay
// =========================================================

if (window.__DYNAMIC_LOADER_2055__) {
  console.warn("[DYNAMIC 2056] dynamic-loader.js già caricato → skip");
} else {
  window.__DYNAMIC_LOADER_2055__ = true;

  (function () {

    console.log("⚡ [DYNAMIC 2056] Avvio dynamic-loader (ULTRA MINIMAL)");

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

        console.log("🟧 [DYNAMIC] Anti-cache applicato");
      } catch (e) {
        console.warn("❌ [DYNAMIC] Errore anti-cache:", e.message);
      }
    }

    // ============================================================
    // 2) ANTI SERVICE WORKER
    // ============================================================
    function removeServiceWorkers() {
      try {
        console.log("🟧 [DYNAMIC] Rimozione service worker + cache HTTP");

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
          });
        }

        if (window.caches) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }

      } catch (e) {
        console.warn("❌ [DYNAMIC] Errore anti-service-worker:", e.message);
      }
    }

    // ============================================================
    // 3) RENDER = FONTE UNICA DI VERITÀ
    // ============================================================
    function forceRenderNoStore() {
      try {
        const scripts = document.querySelectorAll("script[src]");

        scripts.forEach(s => {
          const src = s.getAttribute("src");
          if (!src) return;

          // NON toccare loader, supremo, universale, critical
          if (
            src.includes("loadersupremo") ||
            src.includes("loaderuniversale") ||
            src.includes("dynamic-loader") ||
            src.includes("critical-loader") ||
            src.includes("loader.js")
          ) {
            return;
          }

          const url = new URL(s.src);
          url.searchParams.set("cache", "no-store");
          s.src = url.toString();
        });

        console.log("🟦 [DYNAMIC] Render impostato come fonte unica di verità (SAFE)");
      } catch (e) {
        console.warn("❌ [DYNAMIC] Errore no-store:", e.message);
      }
    }

    // ============================================================
    // 4) EMISSIONE CRITICAL-READY (PATCH 2056)
    // ============================================================
    function emitCriticalReady() {
      try {
        console.log("🟩 [DYNAMIC] Emissione evento critical-ready…");

        // micro-delay per evitare race con loader.js
        setTimeout(() => {
          window.__criticalReady = true;
          document.dispatchEvent(new Event("critical-ready"));
          console.log("💚 [DYNAMIC] critical-ready EMESSO");
        }, 50);

      } catch (e) {
        console.warn("❌ [DYNAMIC] Errore critical-ready:", e.message);
      }
    }

    // ============================================================
    // ESECUZIONE ORDINATA
    // ============================================================
    applyAntiCache();
    removeServiceWorkers();
    forceRenderNoStore();
    emitCriticalReady();

    console.log("🟩 [DYNAMIC 2056] Completato (ULTRA MINIMAL)");

  })();
}
