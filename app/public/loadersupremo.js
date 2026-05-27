// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2062 (GLOBAL-FIRST, NO DYNAMIC QUI)
// Percorso reale: /app/public/loadersupremo.js
// =========================================================

if (!window.__SUPREMO_PUBLIC_2062__) {
  window.__SUPREMO_PUBLIC_2062__ = true;

  (function () {

    const V = "2062";

    console.log("⚡ [SUPREMO PUBLIC 2062] Avvio SUPREMO PUBLIC ULTRA-SAFE");

    // ============================================================
    // CACHE + RUN STATE
    // ============================================================
    window.__SUPREMO_PUBLIC_JS_CACHE__ =
      window.__SUPREMO_PUBLIC_JS_CACHE__ || new Set();

    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || { running: false, done: false };

    // ============================================================
    // Utility caricamento script (PARANOICA, con timeout)
    // ============================================================
    function loadScript(src, where = "head", timeoutMs = 8000) {
      const key = src;

      if (window.__SUPREMO_PUBLIC_JS_CACHE__.has(key)) {
        console.log("⏭️ [SUPREMO PUBLIC] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO PUBLIC] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [SUPREMO PUBLIC] LOAD-OK:", key);
            window.__SUPREMO_PUBLIC_JS_CACHE__.add(key);
          } else {
            console.warn("❌ [SUPREMO PUBLIC] LOAD-FAIL/TIMEOUT:", key);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [SUPREMO PUBLIC] TIMEOUT:", key);
          done(false);
        }, timeoutMs);

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEQUENZA SUPREMO PUBLIC 2062
    // ============================================================
    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;
      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2062] Sequenza SUPREMO avviata");

      // 1) CRITICAL LOADER
      await loadScript("/loader.js");

      // 2) CSS LOADER
      await loadScript("/cssloader.js");
      try {
        document.dispatchEvent(new Event("supremo-public-load-css"));
      } catch (e) {}

      // 3) GLOBAL LOADER (qui dentro carichiamo TUTTI i JS globali, incluso dynamic)
      await loadScript("/global-loader.js");

      // 4) LOADER UNIVERSALE
      await loadScript("/loaderuniversale.js");
      try {
        document.dispatchEvent(new Event("supremo-public-load-universale"));
      } catch (e) {}

      // 5) CRITICAL READY
      if (!window.__criticalReady) {
        window.__criticalReady = true;
        try {
          document.dispatchEvent(new Event("critical-ready"));
          console.log("🟩 [SUPREMO PUBLIC 2062] critical-ready EMESSO");
        } catch (e) {}
      }

      console.log("🟩 [SUPREMO PUBLIC 2062] Sequenza completata");

      state.running = false;
      state.done = true;
    }

    // ============================================================
    // AUTO-START
    // ============================================================
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
}
