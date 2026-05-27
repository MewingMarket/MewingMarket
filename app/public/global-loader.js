// =========================================================
// GLOBAL PUBLIC 2061 — ORDINATO + ULTRA-SAFE
// =========================================================

if (!window.__GLOBAL_LOADER_PUBLIC_2061__) {
  window.__GLOBAL_LOADER_PUBLIC_2061__ = true;

  console.log("⚡ [GLOBAL PUBLIC 2061] Avvio Global Loader PUBLIC");

  (function () {

    const V = "2061";
    const loaded = new Set();

    function loadScript(src, where = "head", timeoutMs = 8000) {
      if (loaded.has(src)) {
        console.log("⏭️ [GLOBAL PUBLIC] LOAD-SKIP:", src);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [GLOBAL PUBLIC] LOAD-REQUEST:", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${V}`;
        s.async = false;

        let settled = false;
        const done = ok => {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [GLOBAL PUBLIC] LOAD-OK:", src);
            loaded.add(src);
          } else {
            console.warn("❌ [GLOBAL PUBLIC] LOAD-FAIL/TIMEOUT:", src);
          }

          resolve(ok);
        };

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [GLOBAL PUBLIC] TIMEOUT:", src);
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
      console.log("🟦 [GLOBAL PUBLIC 2061] Sequenza avviata");

      // 1) AUTH (fondamentale)
      await loadScript("/auth.js");

      // 2) HEADER (fondamentale)
      await loadScript("/header.js");

      // 3) SEO
      await loadScript("/seo.js");
      await loadScript("/structured-data.js");

      // 4) TRACKING (ultimo)
      await loadScript("/tracking.js");

      // 5) CARRELLO (solo shop)
      if (isShopPage()) {
        await loadScript("/carrello.js", "body");
      }

      console.log("🟩 [GLOBAL PUBLIC 2061] Sequenza completata");

      document.dispatchEvent(new Event("supremo-public-load-global-js"));
    }

    window.__runGlobalPublic2058 = runGlobalPublic;

  })();
}
