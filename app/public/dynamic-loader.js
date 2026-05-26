// =========================================================
// DYNAMIC LOADER — SAFE MODE 2056 (ULTRA MINIMAL PUBLIC)
// Patch 2056: anti-loop, critical-ready, micro-delay, fusibile globale
// =========================================================

if (window.__DYNAMIC_LOADER_2056__) {
  console.warn("[DYNAMIC 2056] dynamic-loader.js già caricato → skip");
} else {
  window.__DYNAMIC_LOADER_2056__ = true;

  (function () {

    // 🔥 FUSIBILE: se la logica è già stata eseguita, non rifare nulla
    if (window.__DYNAMIC_PUBLIC_ALREADY_RAN__) {
      console.log("⏭️ [DYNAMIC 2056] Logica già eseguita → skip completo");
      return;
    }
    window.__DYNAMIC_PUBLIC_ALREADY_RAN__ = true;

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
    // 3) RENDER = FONTE UNICA DI VERITÀ (ANTI-LOOP 2056)
    // ============================================================
    // forceRenderNoStore();  // DISATTIVATO — causava reload infinito dei JS
    console.log("🟦 [DYNAMIC 2056] forceRenderNoStore DISATTIVATO (ANTI-LOOP)");

    // (Se un domani vorrai riattivarlo, qui potrai reinserire la funzione
    //  forceRenderNoStore in versione safe, ma ora è GIUSTO che sia spenta.)

    // ============================================================
    // 4) EMISSIONE CRITICAL-READY (PATCH 2056)
    // ============================================================
    function emitCriticalReady() {
      try {
        console.log("🟩 [DYNAMIC] Emissione evento critical-ready…");

        setTimeout(() => {
          // se già emesso, non rifare
          if (window.__criticalReady) {
            console.log("💚 [DYNAMIC] critical-ready era già true → nessuna ri-emissione");
            return;
          }

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
    // forceRenderNoStore è volutamente NON chiamato
    emitCriticalReady();

    console.log("🟩 [DYNAMIC 2056] Completato (ULTRA MINIMAL)");

  })();
}
