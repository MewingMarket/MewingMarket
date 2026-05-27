// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2060 (NO DYNAMIC, PARANOICO)
// Percorso reale: /app/public/admin/loadersupremo-admin-2060.js
// =========================================================

if (!window.__SUPREMO_ADMIN_2060__) {
  window.__SUPREMO_ADMIN_2060__ = true;

  window.__SUPREMO_ADMIN_STANDBY__ =
    window.__SUPREMO_ADMIN_STANDBY__ ?? false;

  (function () {

    const V = "2060";

    console.log(
      "⚡ [SUPREMO ADMIN 2060] Loader admin avviato (NO DYNAMIC, PARANOICO, standby:",
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
    // Utility caricamento script (PARANOICA, con timeout)
    // ============================================================
    function loadScript(src, where = "head", timeoutMs = 8000) {
      const key = src;

      if (window.__SUPREMO_ADMIN_JS_CACHE__.has(key)) {
        console.log("⏭️ [SUPREMO ADMIN] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO ADMIN] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [SUPREMO ADMIN] LOAD-OK:", key);
            window.__SUPREMO_ADMIN_JS_CACHE__.add(key);
          } else {
            console.warn("❌ [SUPREMO ADMIN] LOAD-FAIL/TIMEOUT:", key);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [SUPREMO ADMIN] TIMEOUT:", key);
          done(false);
        }, timeoutMs);

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
    // SEQUENZA SUPREMO ADMIN 2060 (NO DYNAMIC, PARANOICA)
    // ============================================================
    async function runSupremoAdmin() {
      const state = window.__SUPREMO_ADMIN_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO ADMIN 2060] Sequenza SUPREMO avviata");

      // 1) CRITICAL ADMIN
      await loadScript("/admin/loader-admin.js");

      // 2) CSS LOADER ADMIN
      await loadScript("/admin/css-loader-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-css"));

      // 3) GLOBAL LOADER ADMIN
      await loadScript("/admin/global-loader-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-global-js"));

      // 4) NO DYNAMIC

      // 5) LOADER UNIVERSALE ADMIN
      await loadScript("/admin/loader-universale-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-universale"));

      // 6) ATTENDI PAGE-JS-LOADED
      await waitPageJsLoadedIfNeeded();

      // 7) CRITICAL READY
      if (!window.__criticalReady) {
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
        console.log("🟩 [SUPREMO ADMIN 2060] critical-ready EMESSO");
      }

      console.log("🟩 [SUPREMO ADMIN 2060] Sequenza completata");

      state.running = false;
      state.done = true;
    }

    window.runSupremoAdmin2060 = runSupremoAdmin;

    if (!window.__SUPREMO_ADMIN_STANDBY__) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runSupremoAdmin, { once: true });
      } else {
        runSupremoAdmin();
      }
    }

  })();
} else {
  console.warn("SUPREMO ADMIN 2060 già caricato, skip.");
}
