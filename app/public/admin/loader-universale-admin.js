// =========================================================
// LOADER UNIVERSALE ADMIN — PATCH 2058 (VERSIONE FINALE)
// Percorso reale: /app/public/admin/loader-universale-admin.js
// Carica il JS della pagina ADMIN in base a window.__PAGE_ID__
// Emissione evento: admin-page-js-loaded
// =========================================================

if (!window.__LOADER_UNIVERSALE_ADMIN_2058__) {
  window.__LOADER_UNIVERSALE_ADMIN_2058__ = true;

  console.log("⚡ [UNIVERSALE ADMIN 2058] Loader universale ADMIN attivo");

  (function () {

    const VERSION = "2058";

    // Cache per evitare doppi caricamenti
    window.__UNIVERSALE_ADMIN_JS_CACHE__ =
      window.__UNIVERSALE_ADMIN_JS_CACHE__ || new Set();

    // Stato di esecuzione
    window.__UNIVERSALE_ADMIN_RUN_STATE__ =
      window.__UNIVERSALE_ADMIN_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__adminPageJsLoaded = window.__adminPageJsLoaded || false;

    // ============================================================
    // NORMALIZZAZIONE NOME PAGINA
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

    function getPageBaseFromPath() {
      const p = window.location.pathname.replace("/admin/", "");

      if (p === "" || p === "/") return "admin-index";

      const parts = p.split("/").filter(Boolean);

      // Caso /admin/utenti/123
      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      // Caso /admin/dashboard/analytics
      if (parts.length >= 2 && !parts[parts.length - 1].includes(".")) {
        return normalizeName(parts.join("-"));
      }

      // Caso /admin/ordini.html
      return normalizeName(parts.pop());
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
    // CARICA SCRIPT (SAFE)
    // ============================================================
    function loadScript(src) {
      const key = src;

      if (window.__UNIVERSALE_ADMIN_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE ADMIN] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${VERSION}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE ADMIN] LOAD-OK:", key);
          window.__UNIVERSALE_ADMIN_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE ADMIN] LOAD-FAIL:", key);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // CARICA JS DI PAGINA SE NON È GIÀ PRESENTE
    // ============================================================
    async function loadPageScriptIfNeeded(expectedSrc) {
      if (
        document.querySelector(`script[src="${expectedSrc}?v=${VERSION}"]`) ||
        document.querySelector(`script[src="${expectedSrc}"]`)
      ) {
        console.log(`⏭️ [UNIVERSALE ADMIN] Script pagina già nel DOM → skip: ${expectedSrc}`);
        return true;
      }

      console.log(`📦 [UNIVERSALE ADMIN] Script pagina NON presente → loader: ${expectedSrc}`);
      return await loadScript(expectedSrc);
    }

    // ============================================================
    // AVVIO LOADER UNIVERSALE ADMIN
    // ============================================================
    async function runUniversaleAdmin() {
      const state = window.__UNIVERSALE_ADMIN_RUN_STATE__;

      if (state.done || state.running) return;

      state.running = true;

      console.log("🟦 [UNIVERSALE ADMIN] Evento supremo-admin-load-universale → avvio");

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 Pagina normalizzata:", base);
      console.log("🔍 Script atteso:", expectedPageScript);

      await loadPageScriptIfNeeded(expectedPageScript);

      state.running = false;
      state.done = true;

      if (!window.__adminPageJsLoaded) {
        console.log("🟩 [UNIVERSALE ADMIN] admin-page-js-loaded");
        window.__adminPageJsLoaded = true;
        document.dispatchEvent(new Event("admin-page-js-loaded"));
      }
    }

    // Listener da SUPREMO ADMIN
    document.addEventListener("supremo-admin-load-universale", runUniversaleAdmin);

  })();
}
