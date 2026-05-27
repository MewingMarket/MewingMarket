// =========================================================
// LOADER UNIVERSALE PUBLIC — PATCH 2058 PARANOICA
// Percorso reale: /app/public/loaderuniversale.js
// =========================================================

if (!window.__LOADER_UNIVERSALE_PUBLIC_2058__) {
  window.__LOADER_UNIVERSALE_PUBLIC_2058__ = true;

  console.log("⚡ [UNIVERSALE PUBLIC 2058] Loader universale PUBLIC attivo (PARANOICO)");

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
    // CARICAMENTO SCRIPT CON TIMEOUT PARANOICO
    // ============================================================
    function loadScript(src, timeoutMs = 8000) {
      if (window.__UNIVERSALE_PUBLIC_JS_CACHE__.has(src)) {
        console.log("⏭️ [UNIVERSALE PUBLIC] LOAD-SKIP:", src);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE PUBLIC] LOAD-REQUEST:", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false;

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [UNIVERSALE PUBLIC] LOAD-OK:", src);
            window.__UNIVERSALE_PUBLIC_JS_CACHE__.add(src);
          } else {
            console.warn("❌ [UNIVERSALE PUBLIC] LOAD-FAIL/TIMEOUT:", src);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [UNIVERSALE PUBLIC] TIMEOUT:", src);
          done(false);
        }, timeoutMs);

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

      // ⭐ NON BLOCCANTE: anche se index.js fallisce, la pagina continua
      loadScript(src);

      // ⭐ pageInit() può arrivare dopo
      const checkInit = setInterval(() => {
        if (typeof window.pageInit === "function") {
          clearInterval(checkInit);
          console.log("🚀 [UNIVERSALE PUBLIC] pageInit() rilevata → esecuzione");
          try {
            window.pageInit();
          } catch (err) {
            console.error("❌ [UNIVERSALE PUBLIC] Errore in pageInit:", err);
          }

          window.__pageJsLoaded = true;
          document.dispatchEvent(new Event("page-js-loaded"));
          state.running = false;
          state.done = true;
        }
      }, 50);

      // fallback: dopo 3s emetti comunque page-js-loaded
      setTimeout(() => {
        if (!window.__pageJsLoaded) {
          console.warn("⚠️ [UNIVERSALE PUBLIC] pageInit() non trovata → fallback");
          window.__pageJsLoaded = true;
          document.dispatchEvent(new Event("page-js-loaded"));
          state.running = false;
          state.done = true;
        }
      }, 3000);
    }

    document.addEventListener("supremo-public-load-universale", runUniversalePublic);

  })();
}
