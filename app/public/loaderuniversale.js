// =========================================================
// LOADER UNIVERSALE PUBLIC — PATCH 2058 (VERSIONE DEFINITIVA)
// Percorso reale: /app/public/loaderuniversale.js
// Carica il JS della pagina PUBLIC usando i NOMI REALI DEI FILE
// Esempio: /profilo.html → /profilo.js
// =========================================================

if (!window.__LOADER_UNIVERSALE_PUBLIC_2058__) {
  window.__LOADER_UNIVERSALE_PUBLIC_2058__ = true;

  console.log("⚡ [UNIVERSALE PUBLIC 2058] Loader universale PUBLIC attivo");

  (function () {

    const VERSION = "2058";

    window.__UNIVERSALE_PUBLIC_JS_CACHE__ =
      window.__UNIVERSALE_PUBLIC_JS_CACHE__ || new Set();

    window.__UNIVERSALE_PUBLIC_RUN_STATE__ =
      window.__UNIVERSALE_PUBLIC_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

    // ============================================================
    // NORMALIZZAZIONE NOME FILE REALE
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/\.js$/, "")
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/\-+/g, "-")
        .trim();
    }

    // ============================================================
    // LETTURA STRUTTURA REALE → index.html → index.js
    // ============================================================
    function getPageBaseFromPath() {
      const p = window.location.pathname;

      if (p === "/" || p === "") return "index";

      const parts = p.split("/").filter(Boolean);
      const last = parts[parts.length - 1];

      if (!last.includes(".")) return normalizeName(last);

      return normalizeName(last.replace(/\.html?$/, ""));
    }

    function getPageId() {
      if (typeof window.__PAGE_ID__ === "string" && window.__PAGE_ID__.trim()) {
        return normalizeName(window.__PAGE_ID__);
      }
      return getPageBaseFromPath();
    }

    function getExpectedPageScript() {
      const base = getPageId();
      return {
        base,
        src: `/${base}.js`
      };
    }

    // ============================================================
    // CARICAMENTO SCRIPT
    // ============================================================
    function loadScript(src) {
      if (window.__UNIVERSALE_PUBLIC_JS_CACHE__.has(src)) {
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false;

        s.onload = () => {
          window.__UNIVERSALE_PUBLIC_JS_CACHE__.add(src);
          resolve(true);
        };

        s.onerror = () => resolve(false);

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // AVVIO LOADER UNIVERSALE PUBLIC
    // ============================================================
    async function runUniversalePublic() {
      const state = window.__UNIVERSALE_PUBLIC_RUN_STATE__;
      if (state.running || state.done) return;

      state.running = true;

      const { base, src } = getExpectedPageScript();
      console.log("🔍 Pagina reale:", base);
      console.log("🔍 Script atteso:", src);

      await loadScript(src);

      state.running = false;
      state.done = true;

      if (!window.__pageJsLoaded) {
        window.__pageJsLoaded = true;
        document.dispatchEvent(new Event("page-js-loaded"));
      }
    }

    document.addEventListener("supremo-public-load-universale", runUniversalePublic);

  })();
}
