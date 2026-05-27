// =========================================================
// GLOBAL LOADER PUBLIC — Versione 2063
// - Ordine reale dei JS globali
// - Dynamic DISATTIVATO (per test OOM / timeout)
// =========================================================

if (!window.__GLOBAL_LOADER_PUBLIC_2063__) {
  window.__GLOBAL_LOADER_PUBLIC_2063__ = true;

  console.log("⚡ [GLOBAL PUBLIC 2063] Avvio Global Loader PUBLIC");

  (function () {

    const V = "2063";

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

    async function runGlobalPublic() {
      console.log("🟦 [GLOBAL PUBLIC 2063] Sequenza avviata");

      // 1) AUTH (primo)
      await loadScript("/auth.js");

      // 2) HEADER (secondo)
      await loadScript("/header.js");

      // 3) SEO (terzo e quarto)
      await loadScript("/seo.js");
      await loadScript("/structured-data.js");

      
      // 4) CARRELLO (solo shop)
      if (isShopPage()) {
        await loadScript("/carrello.js", "body");
      }

      // 5) DYNAMIC DISATTIVATO PER TEST
      console.log("🟧 [GLOBAL PUBLIC 2063] dynamic-loader DISATTIVATO (test)");

      console.log("🟩 [GLOBAL PUBLIC 2063] Sequenza completata");

      try {
        document.dispatchEvent(new Event("supremo-public-load-global-js"));
      } catch (e) {}
    }

    // esposto col nome che il SUPREMO si aspetta
    window.__runGlobalPublic2058 = runGlobalPublic;

  })();
}
