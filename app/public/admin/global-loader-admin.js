// =========================================================
// GLOBAL LOADER ADMIN — Versione 2058 (PATCH DEFINITIVA)
// Percorso reale: /app/public/admin/global-loader-admin.js
// =========================================================

if (!window.__GLOBAL_LOADER_ADMIN_2058__) {
  window.__GLOBAL_LOADER_ADMIN_2058__ = true;

  console.log("⚡ [GLOBAL ADMIN 2058] Avvio Global Loader ADMIN");

  (function () {

    const V = "2058";

    window.__GLOBAL_ADMIN_JS_CACHE__ =
      window.__GLOBAL_ADMIN_JS_CACHE__ || new Set();

    function loadScript(src, where = "head") {
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

        s.onload = () => {
          console.log("✅ [GLOBAL ADMIN] LOAD-OK:", key);
          window.__GLOBAL_ADMIN_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [GLOBAL ADMIN] LOAD-FAIL:", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEQUENZA GLOBAL ADMIN (PATCH)
    // ============================================================
    async function runGlobalAdmin() {
      console.log("🟦 [GLOBAL ADMIN 2058] Sequenza avviata");

      // JS globali admin
      await loadScript("/auth.js");
      await loadScript("/admin/seo-admin.js");
      await loadScript("/admin/structured-data-admin.js");

      // header-admin.js NON ESISTE → rimosso

      // Tracking globale
      await loadScript("/tracking.js");

      console.log("🟩 [GLOBAL ADMIN 2058] Sequenza completata");

      // Trigger per SUPREMO ADMIN (SOLO QUI)
      document.dispatchEvent(new Event("supremo-admin-load-global-js"));
    }

    // ❗ Il Global Loader NON deve ascoltare il suo stesso evento
    // Viene avviato SOLO dal SUPREMO ADMIN

    window.__runGlobalAdmin2058 = runGlobalAdmin;

  })();
}
