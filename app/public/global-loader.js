// =========================================================
// GLOBAL LOADER PUBLIC — Versione 2062 (ORDINATO + DYNAMIC ULTIMO)
// Percorso reale: /app/public/global-loader.js
// =========================================================

if (!window.__GLOBAL_LOADER_PUBLIC_2062__) {
  window.__GLOBAL_LOADER_PUBLIC_2062__ = true;

  console.log("⚡ [GLOBAL PUBLIC 2062] Avvio Global Loader PUBLIC");

  (function () {

    const V = "2062";

    window.__GLOBAL_PUBLIC_JS_CACHE__ =
      window.__GLOBAL_PUBLIC_JS_CACHE__ || new Set();

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

        setTimeout(() => {
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
    // SEQUENZA GLOBAL PUBLIC 2062 (ordine reale)
    // ============================================================
    async function runGlobalPublic() {
      console.log("🟦 [GLOBAL PUBLIC 2062] Sequenza avviata");

      // 1) AUTH (fondamentale, primo)
      await loadScript("/auth.js");

      // 2) HEADER (secondo, gestisce header.html)
      await loadScript("/header.js");

      // 3) SEO (terzo e quarto)
      await loadScript("/seo.js");
      await loadScript("/structured-data.js");

      // 4) TRACKING (ultimo dei SEO)
      await loadScript("/tracking.js");

      // 5) CARRELLO (solo shop)
      if (isShopPage()) {
        await loadScript("/carrello.js", "body");
      }

      // 6) DYNAMIC LOADER (ULTIMO DI TUTTI, ANTI-CDN / ANTI-SW)
      await loadScript("/dynamic-loader.js");

      console.log("🟩 [GLOBAL PUBLIC 2062] Sequenza completata");

      // Trigger per SUPREMO (se serve)
      try {
        document.dispatchEvent(new Event("supremo-public-load-global-js"));
      } catch (e) {}
    }

    // Esposto per il SUPREMO
    window.__runGlobalPublic2058 = runGlobalPublic;

  })();
}
