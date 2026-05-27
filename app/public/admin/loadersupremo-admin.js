// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2060 (CON DYNAMIC SAFE + TIMEOUT)
// Percorso reale: /app/public/loadersupremo-2060.js
// Pipeline PUBLIC completa, ordinata, deterministica, PARANOICA
// =========================================================

if (!window.__SUPREMO_PUBLIC_2060__) {
  window.__SUPREMO_PUBLIC_2060__ = true;

  (function () {

    const V = "2060";

    console.log("⚡ [SUPREMO PUBLIC 2060] Avvio SUPREMO PUBLIC (CON DYNAMIC + TIMEOUT)");

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
    // Utility caricamento script (PARANOICA, con timeout)
    // ============================================================
    function loadScript(src, where = "head", timeoutMs = 8000) {
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

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [SUPREMO PUBLIC] LOAD-OK:", key);
            window.__SUPREMO_PUBLIC_JS_CACHE__.add(key);
          } else {
            console.warn("❌ [SUPREMO PUBLIC] LOAD-FAIL/TIMEOUT:", key);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [SUPREMO PUBLIC] TIMEOUT:", key);
          done(false);
        }, timeoutMs);

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEQUENZA SUPREMO PUBLIC 2060 (NON BLOCCANTE, CON TIMEOUT)
    // ============================================================
    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2060] Sequenza SUPREMO avviata");

      // 1) CRITICAL LOADER
      await loadScript("/loader.js");

      // 2) CSS LOADER
      await loadScript("/cssloader.js");
      document.dispatchEvent(new Event("supremo-public-load-css"));

      // 3) GLOBAL LOADER
      await loadScript("/global-loader.js");

      // 🔥 NON BLOCCANTE (tracking/structured/carrello possono fallire o ritardare)
      if (typeof window.__runGlobalPublic2058 === "function") {
        console.log("🟦 [SUPREMO PUBLIC 2060] Avvio runGlobalPublic() (NON BLOCCANTE)");
        try {
          window.__runGlobalPublic2058();
        } catch (err) {
          console.error("❌ [SUPREMO PUBLIC 2060] Errore in runGlobalPublic:", err);
        }
      } else {
        console.warn("⚠️ [SUPREMO PUBLIC 2060] __runGlobalPublic2058 non trovato");
      }

      // 4) DYNAMIC LOADER (SAFE 2056)
      await loadScript("/dynamic-loader.js");
      console.log("🟦 [SUPREMO PUBLIC 2060] Dynamic Loader 2056 caricato");

      // 5) LOADER UNIVERSALE
      await loadScript("/loaderuniversale.js");
      document.dispatchEvent(new Event("supremo-public-load-universale"));

      // 6) CRITICAL READY — SOLO QUI
      if (!window.__criticalReady) {
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
        console.log("🟩 [SUPREMO PUBLIC 2060] critical-ready EMESSO");
      }

      console.log("🟩 [SUPREMO PUBLIC 2060] Sequenza completata");

      state.running = false;
      state.done = true;
    }

    // ============================================================
    // AUTO-START
    // ============================================================
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
}
