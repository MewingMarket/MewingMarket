// =========================================================
// DYNAMIC LOADER — SAFE MODE 2055 (ULTRA MINIMAL PUBLIC)
// Percorso reale: /app/public/dynamic-loader.js
// Scopo: garantire che TUTTI i JS successivi siano freschi
// =========================================================

if (window.__DYNAMIC_LOADER_2055__) {
  console.warn("[DYNAMIC 2055] dynamic-loader.js già caricato → skip");
} else {
  window.__DYNAMIC_LOADER_2055__ = true;

  (function () {

    console.log("⚡ [DYNAMIC 2055] Avvio dynamic-loader (ULTRA MINIMAL)");

    // ============================================================
    // 1) ANTI-CACHE — impone al browser di NON fidarsi mai
    // ============================================================
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

    // ============================================================
    // 2) ANTI SERVICE WORKER — elimina ogni possibile interferenza
    // ============================================================
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

    // ============================================================
    // 3) RENDER = FONTE UNICA DI VERITÀ
    // Forza tutti gli script a bypassare la cache
    // ============================================================
    try {
      const forceNoStore = () => {
        const scripts = document.querySelectorAll("script[src]");
        scripts.forEach(s => {
          const url = new URL(s.src);
          url.searchParams.set("cache", "no-store");
          s.src = url.toString();
        });
      };

      forceNoStore();
      console.log("🟦 [DYNAMIC] Render impostato come fonte unica di verità");
    } catch (e) {
      console.warn("❌ [DYNAMIC] Errore no-store:", e.message);
    }

    // ============================================================
    // 4) FINE — nessun evento, nessun blocco, nessuna attesa
    // ============================================================
    console.log("🟩 [DYNAMIC 2055] Completato (ULTRA MINIMAL)");

  })();
}
