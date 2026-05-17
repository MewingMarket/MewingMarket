// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2057 (JAVA-MODE ORDINATO)
// Modalità STANDBY: il file è completo ma NON esegue nulla
// finché non viene attivato manualmente.
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER_2057__) {
  window.__SUPREMO_ADMIN_LOADER_2057__ = true;

  // Flag globale: se true → NON esegue auto-run
  window.__SUPREMO_ADMIN_STANDBY__ =
    window.__SUPREMO_ADMIN_STANDBY__ ?? false;

  (function () {

    const V = "2057";

    // ============================================================
    // PATCH 2057 — GLOBAL FETCH LOCK (ANTI-DUPLICAZIONE)
    // ============================================================
    (function() {
      if (window.__GLOBAL_FETCH_LOCK_PATCHED__) return;
      window.__GLOBAL_FETCH_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO ADMIN 2057] Global Fetch Lock attivo");

      const originalFetch = window.fetch;
      const pending = new Map(); // url → Promise

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
    // PATCH 2057 — GLOBAL SCRIPT LOCK (ANTI-DUPLICAZIONE SCRIPT)
    // ============================================================
    (function() {
      if (window.__GLOBAL_SCRIPT_LOCK_PATCHED__) return;
      window.__GLOBAL_SCRIPT_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO ADMIN 2057] Global Script Lock attivo");

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
    // PATCH 2057 — GLOBAL EVENT LOCK (ANTI-DUPLICAZIONE EVENTI)
    // ============================================================
    (function() {
      if (window.__GLOBAL_EVENT_LOCK_PATCHED__) return;
      window.__GLOBAL_EVENT_LOCK_PATCHED__ = true;

      console.log("🛡️ [SUPREMO ADMIN 2057] Global Event Lock attivo");

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
    // CACHE + LOCK LOCALE
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_ADMIN_RUN_STATE__ =
      window.__SUPREMO_ADMIN_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ =
      window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ || false;

    window.__pageJsLoaded = window.__pageJsLoaded || false;
    window.__criticalReady = window.__criticalReady || false;

    console.log("⚡ [SUPREMO ADMIN 2057] Loader admin caricato (standby:", window.__SUPREMO_ADMIN_STANDBY__, ")");

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
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
          window.__SUPREMO_JS_CACHE__.add(key);
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
    // NORMALIZZAZIONE NOME PAGINA ADMIN
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/\.js$/, "")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .trim();
    }

    function getPageBase() {
      const p = window.location.pathname.replace("/admin/", "");

      if (p === "" || p === "/") return "admin-index";

      const parts = p.split("/").filter(Boolean);

      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      if (parts.length >= 2 && !parts[parts.length - 1].includes(".")) {
        return normalizeName(parts.join("-"));
      }

      return normalizeName(parts.pop());
    }

    function getExpectedPageScript() {
      const base = getPageBase();
      return {
        base,
        src: `/admin/${base}.js`
      };
    }

    // ============================================================
    // Rileva se JS pagina admin è già nel DOM
    // ============================================================
    function paginaAdminHaJsDiPagina(expectedSrc) {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo-admin")) continue;
        if (src.includes("loader-admin")) continue;
        if (src.includes("loader-universale-admin")) continue;

        if (src === expectedSrc || src.startsWith(expectedSrc + "?")) {
          console.log("🔍 [SUPREMO ADMIN] JS pagina già presente:", src);
          return true;
        }
      }

      return false;
    }

    // ============================================================
    // SEQUENZA SUPREMO ADMIN (JAVA-MODE)
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

      console.log("🟦 [SUPREMO ADMIN 2057] Avvio sequenza SUPREMO ADMIN");

      await loadScript("/auth.js");

      const p = window.location.pathname;

      const needSEO =
        p.includes("dashboard") ||
        p.includes("admin-prodotti") ||
        p.includes("admin-confronto");

      const needStructured =
        p.includes("admin-prodotti") ||
        p.includes("dashboard-vendite");

      if (needSEO) await loadScript("/admin/seo-admin.js");
      if (needStructured) await loadScript("/admin/structured-data-admin.js");

      await loadScript("/admin/header-admin.js", "body");

      await new Promise(r => setTimeout(r, 0));

      const { base, src: expectedPageScript } = getExpectedPageScript();

      if (paginaAdminHaJsDiPagina(expectedPageScript)) {
        if (!window.__pageJsLoaded) {
          window.__pageJsLoaded = true;
          document.dispatchEvent(new Event("page-js-loaded"));
        }
      } else {
        if (!window.__LOADER_UNIVERSALE_ADMIN_CARICATO__) {
          window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = true;

          await loadScript("/admin/loader-universale-admin.js");
          document.dispatchEvent(new Event("supremo-admin-load-universale"));
        }
      }

      if (!window.__pageJsLoaded) {
        await new Promise(resolve => {
          document.addEventListener("page-js-loaded", () => {
            window.__pageJsLoaded = true;
            resolve();
          }, { once: true });
        });
      }

      await loadScript("/admin/dynamic-admin-loader.js");

      if (!window.__criticalReady) {
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
      }

      state.running = false;
      state.done = true;
    }

    // ============================================================
    // ESPONE RUN MANUALE
    // ============================================================
    window.runSupremoAdminManual = async function () {
      console.log("🟦 [SUPREMO ADMIN] runSupremoAdminManual() chiamato");
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
  console.warn("SUPREMO ADMIN 2057 già caricato, skip.");
}
