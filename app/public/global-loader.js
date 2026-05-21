// =========================================================
// GLOBAL LOADER PUBLIC — Versione 2058 (JAVA-MODE SAFE)
// Percorso reale: /app/public/global-loader.js
// Carica TUTTI i JS GLOBALI PUBLIC in ordine deterministico
// =========================================================

if (!window.__GLOBAL_LOADER_PUBLIC_2058__) {
  window.__GLOBAL_LOADER_PUBLIC_2058__ = true;

  console.log("⚡ [GLOBAL PUBLIC 2058] Avvio Global Loader PUBLIC");

  (function () {

    const V = "2058";

    window.__GLOBAL_PUBLIC_JS_CACHE__ =
      window.__GLOBAL_PUBLIC_JS_CACHE__ || new Set();

    function loadScript(src, where = "head") {
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

        s.onload = () => {
          console.log("✅ [GLOBAL PUBLIC] LOAD-OK:", key);
          window.__GLOBAL_PUBLIC_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [GLOBAL PUBLIC] LOAD-FAIL:", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // Condizioni caricamento
    // ============================================================
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
    // SEQUENZA GLOBAL PUBLIC
    // ============================================================
    async function runGlobalPublic() {
      console.log("🟦 [GLOBAL PUBLIC 2058] Sequenza avviata");

      await loadScript("/auth.js");
      await loadScript("/seo.js");
      await loadScript("/structured-data.js");
      await loadScript("/header.js", "body");
      await loadScript("/tracking.js");

      if (isShopPage()) {
        await loadScript("/carrello.js", "body");
      }

      console.log("🟩 [GLOBAL PUBLIC 2058] Sequenza completata");

      // Trigger per SUPREMO
      document.dispatchEvent(new Event("supremo-public-load-global-js"));
    }

    document.addEventListener("supremo-public-load-global-js", runGlobalPublic);

  })();
}
