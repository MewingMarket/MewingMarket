// =========================================================
// LOADER UNIVERSALE ADMIN — PATCH 2058 (VERSIONE DEFINITIVA)
// Percorso reale: /app/public/admin/loader-universale-admin.js
// Carica il JS della pagina ADMIN usando i NOMI REALI DEI FILE
// Emissione evento: admin-page-js-loaded
// =========================================================

if (!window.__LOADER_UNIVERSALE_ADMIN_2058__) {
  window.__LOADER_UNIVERSALE_ADMIN_2058__ = true;

  console.log("⚡ [UNIVERSALE ADMIN 2058] Loader universale ADMIN attivo");

  (function () {

    const VERSION = "2058";

    window.__UNIVERSALE_ADMIN_JS_CACHE__ =
      window.__UNIVERSALE_ADMIN_JS_CACHE__ || new Set();

    window.__UNIVERSALE_ADMIN_RUN_STATE__ =
      window.__UNIVERSALE_ADMIN_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__adminPageJsLoaded = window.__adminPageJsLoaded || false;

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
    // LETTURA STRUTTURA REALE ADMIN
    // ============================================================
    function getPageBaseFromPath() {
      const p = window.location.pathname.replace("/admin/", "");

      if (p === "" || p === "/") return "admin-index";

      const parts = p.split("/").filter(Boolean);
      const last = parts[parts.length - 1];

      // Caso /admin/utenti/123
      if (parts.length >= 2 && /^\d+$/.test(last)) {
        return normalizeName(parts[parts.length - 2]);
      }

      // Caso /admin/dashboard/analytics
      if (parts.length >= 2 && !last.includes(".")) {
        return normalizeName(parts.join("-"));
      }

      // Caso /admin/prodotti.html
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
        src: `/admin/js/pagine/${base}.js`
      };
    }

    // ============================================================
    // CARICAMENTO SCRIPT
    // ============================================================
    function loadScript(src) {
      if (window.__UNIVERSALE_ADMIN_JS_CACHE__.has(src)) {
        console.log("⏭️ [UNIVERSALE ADMIN] LOAD-SKIP:", src);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN] LOAD-REQUEST:", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE ADMIN] LOAD-OK:", src);
          window.__UNIVERSALE_ADMIN_JS_CACHE__.add(src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE ADMIN] LOAD-FAIL:", src);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // AVVIO LOADER UNIVERSALE ADMIN
    // ============================================================
    async function runUniversaleAdmin() {
      const state = window.__UNIVERSALE_ADMIN_RUN_STATE__;
      if (state.running || state.done) return;

      state.running = true;

      console.log("🟦 [UNIVERSALE ADMIN] Evento supremo-admin-load-universale → avvio");

      const { base, src } = getExpectedPageScript();
      console.log("🔍 Pagina reale:", base);
      console.log("🔍 Script atteso:", src);

      await loadScript(src);

      state.running = false;
      state.done = true;

      if (!window.__adminPageJsLoaded) {
        console.log("🟩 [UNIVERSALE ADMIN] admin-page-js-loaded");
        window.__adminPageJsLoaded = true;
        document.dispatchEvent(new Event("admin-page-js-loaded"));
      }
    }

    document.addEventListener("supremo-admin-load-universale", runUniversaleAdmin);

  })();
}
