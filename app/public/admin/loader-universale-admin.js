// =========================================================
// LOADER UNIVERSALE ADMIN — PATCH 2058 PARANOICA
// Percorso reale: /app/public/admin/loader-universale-admin.js
// =========================================================

if (!window.__LOADER_UNIVERSALE_ADMIN_2058__) {
  window.__LOADER_UNIVERSALE_ADMIN_2058__ = true;

  console.log("⚡ [UNIVERSALE ADMIN 2058] Loader universale ADMIN attivo (PARANOICO)");

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

    function getPageBaseFromPath() {
      const p = window.location.pathname.replace("/admin/", "");

      if (p === "" || p === "/") return "admin-index";

      const parts = p.split("/").filter(Boolean);
      const last = parts[parts.length - 1];

      if (parts.length >= 2 && /^\d+$/.test(last)) {
        return normalizeName(parts[parts.length - 2]);
      }

      if (parts.length >= 2 && !last.includes(".")) {
        return normalizeName(parts.join("-"));
      }

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
        src: `/admin/${base}.js`
      };
    }

    // ============================================================
    // CARICAMENTO SCRIPT CON TIMEOUT PARANOICO
    // ============================================================
    function loadScript(src, timeoutMs = 8000) {
      if (window.__UNIVERSALE_ADMIN_JS_CACHE__.has(src)) {
        console.log("⏭️ [UNIVERSALE ADMIN] LOAD-SKIP:", src);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN] LOAD-REQUEST:", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false;

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [UNIVERSALE ADMIN] LOAD-OK:", src);
            window.__UNIVERSALE_ADMIN_JS_CACHE__.add(src);
          } else {
            console.warn("❌ [UNIVERSALE ADMIN] LOAD-FAIL/TIMEOUT:", src);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [UNIVERSALE ADMIN] TIMEOUT:", src);
          done(false);
        }, timeoutMs);

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

      const { base, src } = getExpectedPageScript();
      console.log("🔍 Pagina ADMIN reale:", base);
      console.log("🔍 Script atteso:", src);

      // ⭐ NON BLOCCANTE: anche se admin-{pagina}.js fallisce, la pagina continua
      loadScript(src);

      // ⭐ pageInit() può arrivare dopo
      const checkInit = setInterval(() => {
        if (typeof window.pageInit === "function") {
          clearInterval(checkInit);
          console.log("🚀 [UNIVERSALE ADMIN] pageInit() rilevata → esecuzione");
          try {
            window.pageInit();
          } catch (err) {
            console.error("❌ [UNIVERSALE ADMIN] Errore in pageInit:", err);
          }

          window.__adminPageJsLoaded = true;
          document.dispatchEvent(new Event("admin-page-js-loaded"));
          state.running = false;
          state.done = true;
        }
      }, 50);

      // fallback: dopo 3s emetti comunque admin-page-js-loaded
      setTimeout(() => {
        if (!window.__adminPageJsLoaded) {
          console.warn("⚠️ [UNIVERSALE ADMIN] pageInit() non trovata → fallback");
          window.__adminPageJsLoaded = true;
          document.dispatchEvent(new Event("admin-page-js-loaded"));
          state.running = false;
          state.done = true;
        }
      }, 3000);
    }

    document.addEventListener("supremo-admin-load-universale", runUniversaleAdmin);

  })();
}
