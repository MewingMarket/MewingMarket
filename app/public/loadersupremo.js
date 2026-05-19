// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2058 (JAVA-MODE SAFE)
// Single Loader Architecture 2058
// =========================================================

if (!window.__SUPREMO_PUBLIC_2058__) {
  window.__SUPREMO_PUBLIC_2058__ = true;

  (function () {

    const V = "2058";

    console.log("⚡ [SUPREMO PUBLIC 2058] Avvio SUPREMO PUBLIC");

    // ============================================================
    // GLOBAL FETCH LOCK
    // ============================================================
    (function() {
      if (window.__GLOBAL_FETCH_LOCK_PATCHED__) return;
      window.__GLOBAL_FETCH_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO PUBLIC 2058] Global Fetch Lock attivo");

      const originalFetch = window.fetch;
      const pending = new Map();

      window.fetch = function(url, options = {}) {
        const key = typeof url === "string" ? url : url.url;

        if (pending.has(key)) {
          console.log("♻️ [FETCH-LOCK] Riutilizzo fetch:", key);
          return pending.get(key);
        }

        const p = originalFetch(url, options)
          .finally(() => pending.delete(key));

        pending.set(key, p);
        console.log("🚀 [FETCH-LOCK] Nuova fetch:", key);

        return p;
      };
    })();

    // ============================================================
    // GLOBAL SCRIPT LOCK
    // ============================================================
    (function() {
      if (window.__GLOBAL_SCRIPT_LOCK_PATCHED__) return;
      window.__GLOBAL_SCRIPT_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO PUBLIC 2058] Global Script Lock attivo");

      const origCreate = document.createElement;
      const loaded = new Set();

      document.createElement = function(tag) {
        const el = origCreate.call(document, tag);

        if (tag === "script") {
          const origSet = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src").set;

          Object.defineProperty(el, "src", {
            set(v) {
              if (loaded.has(v)) {
                console.warn("⛔ [SCRIPT-LOCK] Script già caricato:", v);
                return;
              }
              loaded.add(v);
              origSet.call(this, v);
            }
          });
        }

        return el;
      };
    })();

    // ============================================================
    // GLOBAL EVENT LOCK
    // ============================================================
    (function() {
      if (window.__GLOBAL_EVENT_LOCK_PATCHED__) return;
      window.__GLOBAL_EVENT_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO PUBLIC 2058] Global Event Lock attivo");

      const emitted = new Set();
      const origDispatch = document.dispatchEvent;

      document.dispatchEvent = function(ev) {
        const name = ev.type;

        if (name === "critical-ready" || name === "page-js-loaded") {
          if (emitted.has(name)) {
            console.warn("⛔ [EVENT-LOCK] Evento già emesso:", name);
            return true;
          }
          emitted.add(name);
        }

        return origDispatch.call(document, ev);
      };
    })();

    // ============================================================
    // CACHE + RUN STATE
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || { running: false, done: false };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [SUPREMO PUBLIC] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO PUBLIC] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [SUPREMO PUBLIC] LOAD-OK:", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [SUPREMO PUBLIC] LOAD-FAIL:", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // Condizioni caricamento
    // ============================================================
    function shouldLoadCarrello() {
      const p = window.location.pathname;
      return (
        p === "/" ||
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto")
      );
    }

    function needSEO() {
      const p = window.location.pathname.toLowerCase();
      return (
        p === "/" ||
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto") ||
        p.includes("faq") ||
        p.includes("assistenza")
      );
    }

    function needStructured() {
      const p = window.location.pathname.toLowerCase();
      return (
        p.includes("catalogo") ||
        p.includes("prodotto")
      );
    }

    // ============================================================
    // SEQUENZA SUPREMO PUBLIC 2058
    // ============================================================
    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2058] Sequenza SUPREMO avviata");

      await loadScript("/loader.js");
      await loadScript("/auth.js");

      if (needSEO()) await loadScript("/seo.js");
      if (needStructured()) await loadScript("/structured-data.js");

      await loadScript("/header.js", "body");

      if (shouldLoadCarrello()) {
        await loadScript("/carrello.js", "body");
      }

      // CSS Loader
      console.log("🎨 [SUPREMO PUBLIC 2058] Trigger CSS Loader");
      document.dispatchEvent(new Event("supremo-public-load-css"));

      // Loader Universale
      console.log("📦 [SUPREMO PUBLIC 2058] Trigger Loader Universale");
      document.dispatchEvent(new Event("supremo-public-load-universale"));

      console.log("🟩 [SUPREMO PUBLIC 2058] Sequenza completata");

      state.running = false;
      state.done = true;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
} else {
  console.warn("SUPREMO PUBLIC 2058 già caricato, skip.");
}
