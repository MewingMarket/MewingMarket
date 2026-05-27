// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2063
// - Critical
// - CSS loader
// - Global loader (e lo fa PARTIRE davvero)
// - Loader universale
// - NESSUN dynamic qui
// =========================================================

if (!window.__SUPREMO_PUBLIC_2063__) {
  window.__SUPREMO_PUBLIC_2063__ = true;

  (function () {

    const V = "2063";

    console.log("⚡ [SUPREMO PUBLIC 2063] Avvio SUPREMO PUBLIC ULTRA-SAFE");

    window.__SUPREMO_PUBLIC_JS_CACHE__ =
      window.__SUPREMO_PUBLIC_JS_CACHE__ || new Set();

    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || { running: false, done: false };

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

    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;
      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2063] Sequenza SUPREMO avviata");

      // 1) CRITICAL LOADER
      await loadScript("/loader.js");

      // 2) CSS LOADER
      await loadScript("/cssloader.js");
      try {
        document.dispatchEvent(new Event("supremo-public-load-css"));
      } catch (e) {}

      // 3) GLOBAL LOADER (solo file, poi lo facciamo PARTIRE)
      await loadScript("/global-loader.js");

      if (typeof window.__runGlobalPublic2058 === "function") {
        console.log("🟦 [SUPREMO PUBLIC 2063] Avvio __runGlobalPublic2058()");
        try {
          await window.__runGlobalPublic2058();
        } catch (err) {
          console.error("❌ [SUPREMO PUBLIC 2063] Errore in __runGlobalPublic2058:", err);
        }
      } else {
        console.warn("⚠️ [SUPREMO PUBLIC 2063] __runGlobalPublic2058 non trovato");
      }

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
          console.log("🟩 [SUPREMO PUBLIC 2063] critical-ready EMESSO");
        } catch (e) {}
      }

      console.log("🟩 [SUPREMO PUBLIC 2063] Sequenza completata");

      state.running = false;
      state.done = true;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
}
