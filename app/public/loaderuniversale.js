// =========================================================
// LOADER UNIVERSALE PUBLIC — VERSIONE 2050 FALLBACK DOM
// =========================================================

if (window.__LOADER_UNIVERSALE_PUBLIC__) {
  console.warn("loaderuniversale.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_PUBLIC__ = true;

  (function () {

    const VERSION = "2050";

    // Cache globale JS già caricati
    window.__UNIVERSALE_JS_CACHE__ = window.__UNIVERSALE_JS_CACHE__ || new Set();

    // Lock esecuzione run()
    window.__UNIVERSALE_PUBLIC_RUN_STATE__ =
      window.__UNIVERSALE_PUBLIC_RUN_STATE__ || {
        running: false,
        done: false
      };

    console.log("⚡ [UNIVERSALE 2050] Avvio loader universale PUBLIC (FALLBACK MODE)");

    // ============================================================
    // NORMALIZZAZIONE
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/\.js$/, "")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .trim();
    }

    // ============================================================
    // NOME BASE PAGINA
    // ============================================================
    function getPageBase() {
      const p = window.location.pathname;

      if (p === "/" || p === "") return "index";

      const parts = p.split("/").filter(Boolean);

      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      if (parts.length >= 2 && !parts[parts.length - 1].includes(".")) {
        return normalizeName(parts.join("-"));
      }

      return normalizeName(parts.pop());
    }

    // ============================================================
    // CARICA SCRIPT (SAFE + CACHE)
    // ============================================================
    function loadScript(src) {
      const key = src;

      if (window.__UNIVERSALE_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE LOAD-SKIP già caricato]", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE LOAD-REQUEST]", key);

        const s = document.createElement("script");
        s.src = key + "?v=" + VERSION;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE LOAD-OK]", key);
          window.__UNIVERSALE_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE LOAD-FAIL]", key);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // FALLBACK: CARICA JS DI PAGINA SOLO SE NON È GIÀ NEL DOM
    // ============================================================
    async function loadPageScriptIfNeeded(base) {
      const pageScript = `/${base}.js`;

      if (
        document.querySelector(`script[src="${pageScript}?v=${VERSION}"]`) ||
        document.querySelector(`script[src="${pageScript}"]`)
      ) {
        console.log(`⏭️ [UNIVERSALE] Script di pagina già nel DOM → skip: ${pageScript}`);
        return true;
      }

      console.log(`📦 [UNIVERSALE] Script di pagina NON presente → fallback loader: ${pageScript}`);
      return await loadScript(pageScript);
    }

    // ============================================================
    // AVVIO (CON LOCK)
    // ============================================================
    async function run() {
      const state = window.__UNIVERSALE_PUBLIC_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [UNIVERSALE] run() già completato, skip.");
        return;
      }
      if (state.running) {
        console.log("⏭️ [UNIVERSALE] run() già in esecuzione, skip.");
        return;
      }

      state.running = true;
      console.log("🟦 [UNIVERSALE] Evento supremo-public-load-universale ricevuto → avvio run()");

      const base = getPageBase();
      console.log("🔍 [UNIVERSALE] Pagina normalizzata:", base);

      await loadPageScriptIfNeeded(base);

      state.running = false;
      state.done = true;

      console.log("🟩 [UNIVERSALE] page-js-loaded");
      document.dispatchEvent(new Event("page-js-loaded"));
    }

    // ============================================================
    // PATCH 2050: ascolta SOLO l’evento del SUPREMO PUBLIC
    // ============================================================
    document.addEventListener("supremo-public-load-universale", run);

  })();
}
