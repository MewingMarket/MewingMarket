// =========================================================
// GLOBAL LOADER PUBLIC — Versione 2058 (PATCH PARANOICA)
// Percorso reale: /app/public/global-loader.js
// =========================================================

if (!window.__GLOBAL_LOADER_PUBLIC_2058__) {
  window.__GLOBAL_LOADER_PUBLIC_2058__ = true;

  console.log("⚡ [GLOBAL PUBLIC 2058] Avvio Global Loader PUBLIC");

  (function () {

    const V = "2058";

    window.__GLOBAL_PUBLIC_JS_CACHE__ =
      window.__GLOBAL_PUBLIC_JS_CACHE__ || new Set();

    // ============================================================
    // CARICAMENTO SCRIPT CON TIMEOUT DI SICUREZZA
    // ============================================================
    function loadScript(src, where = "head", timeoutMs = 8000) {
      const key = src;

      if (window.__GLOBAL_PUBLIC_JS_CACHE__.has(key)) {
        console.log("⏭️ [GLOBAL PUBLIC] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [GLOBAL PUBLIC] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [GLOBAL PUBLIC] LOAD-OK:", key);
            window.__GLOBAL_PUBLIC_JS_CACHE__.add(key);
          } else {
            console.warn("❌ [GLOBAL PUBLIC] LOAD-FAIL/TIMEOUT:", key);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        const t = setTimeout(() => {
          console.warn("⏰ [GLOBAL PUBLIC] TIMEOUT:", key);
          done(false);
        }, timeoutMs);

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    function isShopPage() {
      const p = window.location.pathname.toLowerCase();
      return (
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto") ||
        p === "/"
      );
    }

    // ============================================================
    // SEQUENZA GLOBAL PUBLIC (PATCH PARANOICA)
    // ============================================================
    async function runGlobalPublic() {
      console.log("🟦 [GLOBAL PUBLIC 2058] Sequenza avviata");

      // Fondamentali → bloccanti
      await loadScript("/auth.js");
      await loadScript("/seo.js");

      // Non fondamentali → NON bloccanti
      loadScript("/structured-data.js");
      loadScript("/tracking.js");

      if (isShopPage()) {
        loadScript("/carrello.js", "body");
      }

      console.log("🟩 [GLOBAL PUBLIC 2058] Sequenza completata");

      // Trigger per SUPREMO PUBLIC (SOLO QUI)
      document.dispatchEvent(new Event("supremo-public-load-global-js"));
    }

    // Il Global Loader NON deve ascoltare il suo stesso evento
    window.__runGlobalPublic2058 = runGlobalPublic;

  })();
}
