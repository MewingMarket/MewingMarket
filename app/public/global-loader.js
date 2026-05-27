// =========================================================
// GLOBAL LOADER PUBLIC — Versione 2064 ULTRA-SAFE
// - Ordine reale dei JS globali
// - Dynamic ULTRA-SAFE (non blocca mai)
// - Log avanzati per debugging
// - runGlobalPublic con try/catch totale
// =========================================================

if (!window.__GLOBAL_LOADER_PUBLIC_2064__) {
  window.__GLOBAL_LOADER_PUBLIC_2064__ = true;

  console.log("⚡ [GLOBAL PUBLIC 2064] Avvio Global Loader PUBLIC");

  (function () {

    const V = "2064";

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
      console.log("🟦 [GLOBAL PUBLIC 2064] Sequenza avviata");

      try {
        console.log("GLOBAL → AUTH");
        await loadScript("/auth.js");

        console.log("GLOBAL → HEADER");
        await loadScript("/header.js");

        console.log("GLOBAL → SEO");
        await loadScript("/seo.js");

        console.log("GLOBAL → STRUCTURED");
        await loadScript("/structured-data.js");

        if (isShopPage()) {
          console.log("GLOBAL → CARRELLO");
          await loadScript("/carrello.js", "body");
        }

        // ======================================================
        // 5) DYNAMIC ULTRA-SAFE (NON BLOCCA MAI)
        // ======================================================
        console.log("GLOBAL → DYNAMIC");
        try {
          await loadScript("/dynamic-loader.js");
          console.log("🟩 [GLOBAL PUBLIC 2064] Dynamic ULTRA-SAFE caricato");
        } catch (e) {
          console.warn("⚠️ [GLOBAL PUBLIC 2064] Dynamic non caricato:", e);
        }

        console.log("🟩 [GLOBAL PUBLIC 2064] Sequenza completata");

        try {
          document.dispatchEvent(new Event("supremo-public-load-global-js"));
        } catch (e) {
          console.warn("⚠️ [GLOBAL PUBLIC] Errore dispatch evento supremo:", e);
        }

      } catch (e) {
        console.error("❌ [GLOBAL PUBLIC 2064] Errore nella sequenza:", e);
      }
    }

    // esposto col nome che il SUPREMO si aspetta
    window.__runGlobalPublic2058 = runGlobalPublic;

  })();
}