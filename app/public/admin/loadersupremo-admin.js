// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2058 (VERSIONE DEFINITIVA)
// Percorso reale: /app/public/admin/loadersupremo-admin.js
// Pipeline ADMIN 2058 completa, ordinata, JAVA-MODE SAFE
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

    window.__adminPageJsLoaded = window.__adminPageJsLoaded || false;
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
    // WAIT PAGE-JS-LOADED
    // ============================================================
    function waitPageJsLoadedIfNeeded() {
      if (window.__adminPageJsLoaded) return Promise.resolve(true);

      return new Promise(resolve => {
        const handler = () => {
          window.__adminPageJsLoaded = true;
          resolve(true);
        };

        document.addEventListener("admin-page-js-loaded", handler, { once: true });
        document.addEventListener("page-js-loaded", handler, { once: true });
      });
    }

    // ============================================================
    // SEQUENZA SUPREMO ADMIN 2058 (DEFINITIVA)
    // ============================================================
    async function runSupremoAdmin() {
      const state = window.__SUPREMO_ADMIN_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO ADMIN 2058] Sequenza SUPREMO avviata");

      // 1) CRITICAL ADMIN
      await loadScript("/admin/loader-admin.js");

      // 2) CSS LOADER ADMIN (carica il file e poi lancia l’evento)
      await loadScript("/admin/css-loader-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-css"));

      // 3) GLOBAL LOADER ADMIN
      await loadScript("/admin/global-loader-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-global-js"));

      // 4) DYNAMIC ADMIN (PRIMA DEL PAGE-JS)
      await loadScript("/admin/dynamic-admin-loader.js");

      // 5) LOADER UNIVERSALE ADMIN
      await loadScript("/admin/loader-universale-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-universale"));

      // 6) ATTENDI PAGE-JS-LOADED
      await waitPageJsLoadedIfNeeded();

      // 7) CRITICAL READY (una sola volta)
      if (!window.__criticalReady) {
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
      }

      console.log("🟩 [SUPREMO ADMIN 2058] Sequenza completata");

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
