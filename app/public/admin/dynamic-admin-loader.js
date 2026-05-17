// =========================================================
// DYNAMIC ADMIN LOADER — SAFE MODE 2056 (ULTRA MINIMAL)
// Percorso reale: /app/public/admin/dynamic-admin-loader.js
// Scopo: garantire che TUTTI i JS successivi siano freschi
// Compatibile con SUPREMO ADMIN 2056 (no loop, no race)
// =========================================================

if (window.__DYNAMIC_ADMIN_LOADER_2056__) {
  console.warn("[DYNAMIC ADMIN 2056] dynamic-admin-loader.js già caricato → skip");
} else {
  window.__DYNAMIC_ADMIN_LOADER_2056__ = true;

  (function () {

    // 🔥 FUSIBILE: se la logica è già stata eseguita, non rifare nulla
    if (window.__DYNAMIC_ADMIN_ALREADY_RAN__) {
      console.log("⏭️ [DYNAMIC ADMIN 2056] Logica già eseguita → skip completo");
      return;
    }
    window.__DYNAMIC_ADMIN_ALREADY_RAN__ = true;

    console.log("⚡ [DYNAMIC ADMIN 2056] Avvio dynamic-admin-loader (SAFE MODE)");

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
    // 3) RENDER = FONTE UNICA DI VERITÀ (SAFE MODE 2056, ANTI-LOOP)
// NON tocca loader, supremo, universale, critical
    // ============================================================
    function forceRenderNoStore() {
      try {
        const scripts = document.querySelectorAll("script[src]");

        scripts.forEach(s => {
          const src = s.getAttribute("src");
          if (!src) return;

          // NON toccare i loader della pipeline
          if (
            src.includes("loadersupremo-admin") ||
            src.includes("loader-universale-admin") ||
            src.includes("admin-critical-loader") ||
            src.includes("dynamic-admin-loader") ||
            src.includes("loadersupremo") ||
            src.includes("loaderuniversale") ||
            src.includes("critical-loader") ||
            src.includes("dynamic-loader")
          ) {
            return;
          }

          const url = new URL(s.src);

          // 🔥 PATCH ANTI-LOOP: se già contiene cache= → NON toccare
          if (url.searchParams.has("cache")) {
            return;
          }

          // Applica no-store una sola volta
          url.searchParams.set("cache", "no-store");
          s.src = url.toString();
        });

        console.log("🟦 [DYNAMIC ADMIN] Render impostato come fonte unica di verità (SAFE 2056 + ANTI-LOOP)");
      } catch (e) {
        console.warn("❌ [DYNAMIC ADMIN] Errore no-store:", e.message);
      }
    }

    // ============================================================
    // 4) MICRO-DELAY per evitare race con SUPREMO ADMIN
    // ============================================================
    function microDelay() {
      return new Promise(r => setTimeout(r, 15));
    }

    // ============================================================
    // ESECUZIONE ORDINATA (JAVA-MODE)
    // ============================================================
    (async () => {
      applyAntiCache();
      removeServiceWorkers();
      await microDelay();
      forceRenderNoStore();

      console.log("🟩 [DYNAMIC ADMIN 2056] Completato (ULTRA MINIMAL SAFE)");
    })();

  })();
}
