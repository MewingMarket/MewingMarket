// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2057 (JAVA-MODE SAFE)
// VERSIONE DEBUG — TUTTI I CARICAMENTI DISATTIVATI
// =========================================================

if (!window.__SUPREMO_PUBLIC_2057__) {
  window.__SUPREMO_PUBLIC_2057__ = true;

  (function () {

    const V = "2057";

    // ============================================================
    // PATCH 2057 — GLOBAL FETCH LOCK (ANTI-DUPLICAZIONE)
    // ============================================================
    (function() {
      if (window.__GLOBAL_FETCH_LOCK_PATCHED__) return;
      window.__GLOBAL_FETCH_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO PUBLIC 2057] Global Fetch Lock attivo");

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
    // PATCH 2057 — GLOBAL SCRIPT LOCK
    // ============================================================
    (function() {
      if (window.__GLOBAL_SCRIPT_LOCK_PATCHED__) return;
      window.__GLOBAL_SCRIPT_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO PUBLIC 2057] Global Script Lock attivo");

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
    // PATCH 2057 — GLOBAL EVENT LOCK
    // ============================================================
    (function() {
      if (window.__GLOBAL_EVENT_LOCK_PATCHED__) return;
      window.__GLOBAL_EVENT_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO PUBLIC 2057] Global Event Lock attivo");

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
    // CACHE + LOCK
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || { running: false, done: false };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

    console.log("⚡ [SUPREMO PUBLIC 2057] Inizializzazione SUPREMO (DEBUG MODE)…");

    // ============================================================
    // Utility caricamento script (NON USATA IN DEBUG)
    // ============================================================
    function loadScript(src, where = "head") {
      console.log("⛔ [DEBUG] loadScript BLOCCATO:", src);
      return Promise.resolve(true);
    }

    // ============================================================
    // Sequenza PUBLIC (DEBUG: TUTTO DISATTIVATO)
    // ============================================================
    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2057] Sequenza SUPREMO (DEBUG MODE) avviata");

      // ============================================================
      // 🔥 UNICO SCRIPT PERMESSO: loader.js
      // ============================================================
      await loadScript("/loader.js");

      // ============================================================
      // ❌ TUTTO IL RESTO DISATTIVATO
      // ============================================================
      console.log("⛔ [DEBUG] Caricamenti globali disattivati:");
      console.log("   - auth.js");
      console.log("   - seo.js");
      console.log("   - structured-data.js");
      console.log("   - tracking.js");
      console.log("   - header.js");
      console.log("   - carrello.js");
      console.log("   - dynamic-loader.js");
      console.log("   - page-js");

      state.running = false;
      state.done = true;
    }

    // Trigger
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
} else {
  console.warn("SUPREMO PUBLIC 2057 già caricato, skip.");
}
