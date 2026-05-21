// =========================================================
// GLOBAL LOADER ADMIN — Versione 2058 (JAVA-MODE SAFE)
// Percorso reale: /app/public/admin/global-loader-admin.js
// Carica TUTTI i JS GLOBALI ADMIN in ordine deterministico
// Emissione evento: supremo-admin-load-global-js
// =========================================================

if (!window.__GLOBAL_LOADER_ADMIN_2058__) {
  window.__GLOBAL_LOADER_ADMIN_2058__ = true;

  console.log("⚡ [GLOBAL ADMIN 2058] Avvio Global Loader ADMIN");

  (function () {

    const V = "2058";

    window.__GLOBAL_ADMIN_JS_CACHE__ =
      window.__GLOBAL_ADMIN_JS_CACHE__ || new Set();

    // ============================================================
    // Utility caricamento script
    // ============================================================
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
    // SEQUENZA GLOBAL ADMIN
    // ============================================================
    async function runGlobalAdmin() {
      console.log("🟦 [GLOBAL ADMIN 2058] Sequenza avviata");

      // JS globali admin
      await loadScript("/auth.js");
      await loadScript("/admin/seo-admin.js");
      await loadScript("/admin/structured-data-admin.js");
      await loadScript("/admin/header-admin.js", "body");

      // Tracking globale (stesso del public)
      await loadScript("/tracking.js");

      console.log("🟩 [GLOBAL ADMIN 2058] Sequenza completata");

      // Trigger per SUPREMO ADMIN
      document.dispatchEvent(new Event("supremo-admin-load-global-js"));
    }

    // Listener da SUPREMO ADMIN
    document.addEventListener("supremo-admin-load-global-js", runGlobalAdmin);

  })();
}
