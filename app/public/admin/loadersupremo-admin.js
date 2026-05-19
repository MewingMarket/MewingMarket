// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2058 (JAVA-MODE ORDINATO)
// Modalità STANDBY: se __SUPREMO_ADMIN_STANDBY__ === true
// NON parte in auto, ma puoi chiamare window.runSupremoAdmin2058()
// Integra Loader Universale Admin 2058 + CSS Loader Admin 2058
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER_2058__) {
  window.__SUPREMO_ADMIN_LOADER_2058__ = true;

  // Flag globale: se true → niente auto-run
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
    // GLOBAL FETCH LOCK (condiviso, ma idempotente)
    // ============================================================
    (function() {
      if (window.__GLOBAL_FETCH_LOCK_PATCHED__) return;
      window.__GLOBAL_FETCH_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO ADMIN 2058] Global Fetch Lock attivo");

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

      console.log("🛡️ [SUPREMO ADMIN 2058] Global Script Lock attivo");

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

      console.log("🛡️ [SUPREMO ADMIN 2058] Global Event Lock attivo");

      const emitted = new Set();
      const origDispatch = document.dispatchEvent;

      document.dispatchEvent = function(ev) {
        const name = ev.type;

        if (
          name === "critical-ready" ||
          name === "page-js-loaded" ||
          name === "admin-page-js-loaded"
        ) {
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
        console.log("⏭️ [SUPREMO ADMIN] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO ADMIN] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [SUPREMO ADMIN] LOAD-OK:", key);
          window.__SUPREMO_ADMIN_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [SUPREMO ADMIN] LOAD-FAIL:", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEO / STRUCTURED ADMIN (stessa logica 2057)
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
    // WAIT PAGE-JS-LOADED (page-js-loaded o admin-page-js-loaded)
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

      if (state.done && window.__pageJsLoaded && window.__criticalReady) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già completata");
        return;
      }
      if (state.running) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già in esecuzione");
        return;
      }

      state.running = true;

      console.log("🟦 [SUPREMO ADMIN 2058] Avvio sequenza SUPREMO ADMIN");

      // 1) AUTH (riusa /auth.js come nel 2057)
      await loadScript("/auth.js");

      const p = window.location.pathname;

      // 2) SEO / STRUCTURED ADMIN
      if (needSEOAdmin()) {
        await loadScript("/admin/seo-admin.js");
      }
      if (needStructuredAdmin()) {
        await loadScript("/admin/structured-data-admin.js");
      }

      // 3) HEADER ADMIN
      await loadScript("/admin/header-admin.js", "body");

      // 4) MICRO-WAIT deterministico
      await new Promise(r => setTimeout(r, 0));

      // 5) CSS LOADER ADMIN
      console.log("🎨 [SUPREMO ADMIN 2058] Trigger CSS Loader ADMIN");
      document.dispatchEvent(new Event("supremo-admin-load-css"));

      // 6) LOADER UNIVERSALE ADMIN (JS pagina)
      console.log("📦 [SUPREMO ADMIN 2058] Carico loader-universale-admin + trigger");
      await loadScript("/admin/loader-universale-admin.js");
      document.dispatchEvent(new Event("supremo-admin-load-universale"));

      // 7) Attendo che il JS di pagina segnali il completamento
      await waitPageJsLoadedIfNeeded();

      // 8) dynamic-admin-loader (se ancora ti serve)
      await loadScript("/admin/dynamic-admin-loader.js");

      // 9) critical-ready (solo una volta)
      if (!window.__criticalReady) {
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
      }

      state.running = false;
      state.done = true;

      console.log("🟩 [SUPREMO ADMIN 2058] Sequenza ADMIN completata");
    }

    // ============================================================
    // ESPONE RUN MANUALE
    // ============================================================
    window.runSupremoAdmin2058 = async function () {
      console.log("🟦 [SUPREMO ADMIN] runSupremoAdmin2058() chiamato");
      await runSupremoAdmin();
    };

    // ============================================================
    // AUTO-RUN SOLO SE NON IN STANDBY
    // ============================================================
    function autoTriggerSupremoAdmin() {
      if (window.__SUPREMO_ADMIN_STANDBY__) {
        console.log("⏸️ [SUPREMO ADMIN] Modalità STANDBY attiva → nessun auto-run");
        return;
      }
      runSupremoAdmin();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoTriggerSupremoAdmin, { once: true });
    } else {
      autoTriggerSupremoAdmin();
    }

  })();
} else {
  console.warn("SUPREMO ADMIN 2058 già caricato, skip.");
}
