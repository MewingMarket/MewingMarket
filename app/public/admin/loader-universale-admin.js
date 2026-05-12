// =========================================================
// LOADER UNIVERSALE ADMIN 2055 — FALLBACK DOM MODE
// Percorso reale: /app/public/admin/loader-universale-admin.js
// Ruolo: SOLO FALLBACK, chiamato dal SUPREMO ADMIN
// =========================================================

if (window.__LOADER_UNIVERSALE_ADMIN_2055__) {
  console.warn("[UNIVERSALE ADMIN 2055] Già caricato → skip");
} else {
  window.__LOADER_UNIVERSALE_ADMIN_2055__ = true;

  (function () {

    const VERSION = "2055";

    // Cache locale per gli script caricati dall’universale (separata dal SUPREMO)
    window.__UNIVERSALE_ADMIN_JS_CACHE__ =
      window.__UNIVERSALE_ADMIN_JS_CACHE__ || new Set();

    // Stato esecuzione universale (solo fallback)
    window.__UNIVERSALE_ADMIN_RUN_STATE__ =
      window.__UNIVERSALE_ADMIN_RUN_STATE__ || {
        running: false,
        done: false
      };

    console.log("⚡ [UNIVERSALE ADMIN 2055] Avvio loader universale ADMIN (FALLBACK MODE)");

    // ============================================================
    // NORMALIZZAZIONE
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

    // ============================================================
    // NOME BASE PAGINA
    // ============================================================
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

    // ============================================================
    // CARICA SCRIPT (SAFE + CACHE LOCALE)
    // ============================================================
    function loadScript(src) {
      const key = src;

      if (window.__UNIVERSALE_ADMIN_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE ADMIN] LOAD-SKIP già caricato:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN] LOAD-REQUEST", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${VERSION}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE ADMIN] LOAD-OK", key);
          window.__UNIVERSALE_ADMIN_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE ADMIN] LOAD-FAIL", key);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // FALLBACK: CARICA JS DI PAGINA SOLO SE NON È GIÀ NEL DOM
    // ============================================================
    async function loadPageScriptIfNeeded(base) {
      const pageScript = `/admin/${base}.js`;

      if (
        document.querySelector(`script[src="${pageScript}?v=${VERSION}"]`) ||
        document.querySelector(`script[src="${pageScript}"]`)
      ) {
        console.log(`⏭️ [UNIVERSALE ADMIN] Script pagina già nel DOM → skip: ${pageScript}`);
        return true;
      }

      console.log(`📦 [UNIVERSALE ADMIN] Script pagina NON presente → fallback loader: ${pageScript}`);
      return await loadScript(pageScript);
    }

    // ============================================================
    // AVVIO (CON LOCK LOCALE, SOLO SU EVENTO SUPREMO)
    // ============================================================
    async function run() {
      const state = window.__UNIVERSALE_ADMIN_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [UNIVERSALE ADMIN] run() già completato → skip");
        return;
      }
      if (state.running) {
        console.log("⏭️ [UNIVERSALE ADMIN] run() già in esecuzione → skip");
        return;
      }

      state.running = true;

      console.log("🟦 [UNIVERSALE ADMIN] Evento supremo-admin-load-universale ricevuto → avvio run()");

      const base = getPageBase();
      console.log("🔍 [UNIVERSALE ADMIN] Pagina normalizzata:", base);

      await loadPageScriptIfNeeded(base);

      state.running = false;
      state.done = true;

      console.log("🟩 [UNIVERSALE ADMIN] page-js-loaded (fallback universale)");
      document.dispatchEvent(new Event("page-js-loaded"));
    }

    // ============================================================
    // PATCH 2055: ascolta SOLO l’evento del SUPREMO ADMIN
    // ============================================================
    document.addEventListener("supremo-admin-load-universale", run);

  })();
}
