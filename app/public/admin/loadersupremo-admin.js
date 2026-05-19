// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2058 (JAVA-MODE ORDINATO)
// Modalità STANDBY opzionale
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER_2058__) {
  window.__SUPREMO_ADMIN_LOADER_2058__ = true;

  window.__SUPREMO_ADMIN_STANDBY__ =
    window.__SUPREMO_ADMIN_STANDBY__ ?? false;

  (function () {

    const V = "2058";

    console.log(
      "⚡ [SUPREMO ADMIN 2058] Loader admin caricato (standby:",
      window.__SUPREMO_ADMIN_STANDBY__,
      ")"
    );

    // ============================================================
    // GLOBAL LOCKS (fetch, script, event)
    // ============================================================
    (function() {
      if (window.__GLOBAL_FETCH_LOCK_PATCHED__) return;
      window.__GLOBAL_FETCH_LOCK_PATCHED__ = true;

      const originalFetch = window.fetch;
      const pending = new Map();

      window.fetch = function(url, options = {}) {
        const key = typeof url === "string" ? url : url.url;

        if (pending.has(key)) return pending.get(key);

        const p = originalFetch(url, options)
          .finally(() => pending.delete(key));

        pending.set(key, p);
        return p;
      };
    })();

    (function() {
      if (window.__GLOBAL_SCRIPT_LOCK_PATCHED__) return;
      window.__GLOBAL_SCRIPT_LOCK_PATCHED__ = true;

      const origCreate = document.createElement;
      const loaded = new Set();

      document.createElement = function(tag) {
        const el = origCreate.call(document, tag);

        if (tag === "script") {
          const origSet = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src").set;

          Object.defineProperty(el, "src", {
            set(v) {
              if (loaded.has(v)) return;
              loaded.add(v);
              origSet.call(this, v);
            }
          });
        }

        return el;
      };
    })();

    (function() {
      if (window.__GLOBAL_EVENT_LOCK_PATCHED__) return;
      window.__GLOBAL_EVENT_LOCK_PATCHED__ = true;

      const emitted = new Set();
      const origDispatch = document.dispatchEvent;

      document.dispatchEvent = function(ev) {
        const name = ev.type;

        if (
          name === "critical-ready" ||
          name === "page-js-loaded" ||
          name === "admin-page-js-loaded"
        ) {
          if (emitted.has(name)) return true;
          emitted.add(name);
        }

        return origDispatch.call(document, ev);
      };
    })();

    // ============================================================
    // CACHE + RUN STATE
    // ============================================================
    window.__SUPREMO_ADMIN_JS_CACHE__ =
      window.__SUPREMO_ADMIN_JS_CACHE__ || new Set();

    window.__SUPREMO_ADMIN_RUN_STATE__ =
      window.__SUPREMO_ADMIN_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__pageJsLoaded = window.__pageJsLoaded || false;
    window.__criticalReady = window.__criticalReady || false;

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_ADMIN_JS_CACHE__.has(key)) {
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          window.__SUPREMO_ADMIN_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => resolve(false);

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEO / STRUCTURED ADMIN
    // ============================================================
    function needSEOAdmin() {
      const p = window.location.pathname;
      return (
        p.includes("dashboard") ||
        p.includes("admin-prodotti") ||
        p.includes("admin-confronto")
      );
    }

    function needStructuredAdmin() {
      const p = window.location.pathname;
      return (
        p.includes("admin-prodotti") ||
        p.includes("dashboard-vendite")
      );
    }

    // ============================================================
    // WAIT PAGE-JS-LOADED
    // ============================================================
    function waitPageJsLoadedIfNeeded() {
      if (window.__pageJsLoaded) return Promise.resolve(true);

      return new Promise(resolve => {
        const handler = () => {
          window.__pageJsLoaded = true;
          resolve(true);
        };

        document.addEventListener("page-js-loaded", handler, { once: true });
        document.addEventListener("admin-page-js-loaded", handler, { once: true });
      });
    }

    // ============================================================
    // SEQUENZA SUPREMO ADMIN 2058
    // ============================================================
    async function runSupremoAdmin() {
      const state = window.__SUPREMO_ADMIN_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      await loadScript("/auth.js");

      if (needSEOAdmin()) await loadScript("/admin/seo-admin.js");
      if (needStructuredAdmin()) await loadScript("/admin/structured-data-admin.js");

      await loadScript("/admin/header-admin.js", "body");

      await new Promise(r => setTimeout(r, 0));

      // CSS Loader Admin
      document.dispatchEvent(new Event("supremo-admin-load-css"));

      // Loader Universale Admin
      await loadScript("/admin/loader-universale-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-universale"));

      await waitPageJsLoadedIfNeeded();

      await loadScript("/admin/dynamic-admin-loader.js");

      if (!window.__criticalReady) {
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
      }

      state.running = false;
      state.done = true;
    }

    window.runSupremoAdmin2058 = runSupremoAdmin;

    if (!window.__SUPREMO_ADMIN_STANDBY__) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runSupremoAdmin, { once: true });
      } else {
        runSupremoAdmin();
      }
    }

  })();
} else {
  console.warn("SUPREMO ADMIN 2058 già caricato, skip.");
}
