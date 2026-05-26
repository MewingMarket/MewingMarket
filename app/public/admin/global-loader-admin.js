// =========================================================
// GLOBAL LOADER ADMIN — Versione 2058 (PATCH PARANOICA)
// Percorso reale: /app/public/admin/global-loader-admin.js
// =========================================================

if (!window.__GLOBAL_LOADER_ADMIN_2058__) {
  window.__GLOBAL_LOADER_ADMIN_2058__ = true;

  console.log("⚡ [GLOBAL ADMIN 2058] Avvio Global Loader ADMIN");

  (function () {

    const V = "2058";

    window.__GLOBAL_ADMIN_JS_CACHE__ =
      window.__GLOBAL_ADMIN_JS_CACHE__ || new Set();

    // ============================================================
    // CARICAMENTO SCRIPT CON TIMEOUT DI SICUREZZA
    // ============================================================
    function loadScript(src, where = "head", timeoutMs = 8000) {
      const key = src;

      if (window.__GLOBAL_ADMIN_JS_CACHE__.has(key)) {
        console.log("⏭️ [GLOBAL ADMIN] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [GLOBAL ADMIN] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        let settled = false;

        function done(ok) {
          if (settled) return;
          settled = true;

          if (ok) {
            console.log("✅ [GLOBAL ADMIN] LOAD-OK:", key);
            window.__GLOBAL_ADMIN_JS_CACHE__.add(key);
          } else {
            console.warn("❌ [GLOBAL ADMIN] LOAD-FAIL/TIMEOUT:", key);
          }

          resolve(ok);
        }

        s.onload = () => done(true);
        s.onerror = () => done(false);

        setTimeout(() => {
          console.warn("⏰ [GLOBAL ADMIN] TIMEOUT:", key);
          done(false);
        }, timeoutMs);

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEQUENZA GLOBAL ADMIN (PATCH PARANOICA)
    // ============================================================
    async function runGlobalAdmin() {
      console.log("🟦 [GLOBAL ADMIN 2058] Sequenza avviata");

      // Fondamentali admin → bloccanti
      await loadScript("/auth.js");
      await loadScript("/admin/seo-admin.js");

      // Non fondamentali → NON bloccanti
      loadScript("/admin/structured-data-admin.js");
      loadScript("/tracking.js");

      console.log("🟩 [GLOBAL ADMIN 2058] Sequenza completata");

      // Trigger per SUPREMO ADMIN (SOLO QUI)
      document.dispatchEvent(new Event("supremo-admin-load-global-js"));
    }

    // Il Global Loader NON deve ascoltare il suo stesso evento
    window.__runGlobalAdmin2058 = runGlobalAdmin;

  })();
}
