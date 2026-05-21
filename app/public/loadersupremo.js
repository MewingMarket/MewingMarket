// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2058 (NO DYNAMIC)
// Percorso reale: /app/public/loadersupremo.js
// Pipeline PUBLIC 2058 completa e ordinata
// =========================================================

if (!window.__SUPREMO_PUBLIC_2058__) {
  window.__SUPREMO_PUBLIC_2058__ = true;

  (function () {

    const V = "2058";

    console.log("⚡ [SUPREMO PUBLIC 2058] Avvio SUPREMO PUBLIC (NO DYNAMIC)");

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

        if (name === "critical-ready" || name === "page-js-loaded") {
          if (emitted.has(name)) return true;
          emitted.add(name);
        }

        return origDispatch.call(document, ev);
      };
    })();

    // ============================================================
    // CACHE + RUN STATE
    // ============================================================
    window.__SUPREMO_PUBLIC_JS_CACHE__ =
      window.__SUPREMO_PUBLIC_JS_CACHE__ || new Set();

    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || { running: false, done: false };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_PUBLIC_JS_CACHE__.has(key)) {
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
          window.__SUPREMO_PUBLIC_JS_CACHE__.add(key);
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
    // SEQUENZA SUPREMO PUBLIC 2058 (NO DYNAMIC)
    // ============================================================
    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2058] Sequenza SUPREMO avviata (NO DYNAMIC)");

      // 1) CRITICAL LOADER
      await loadScript("/loader.js");

      // 2) CSS LOADER
      await loadScript("/cssloader.js");
      document.dispatchEvent(new Event("supremo-public-load-css"));

      // 3) GLOBAL LOADER
      await loadScript("/global-loader.js");
      document.dispatchEvent(new Event("supremo-public-load-global-js"));

      // ❌ 4) DYNAMIC LOADER — DISATTIVATO

      // 5) LOADER UNIVERSALE
      await loadScript("/loaderuniversale.js");
      document.dispatchEvent(new Event("supremo-public-load-universale"));

      console.log("🟩 [SUPREMO PUBLIC 2058] Sequenza completata (NO DYNAMIC)");

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
