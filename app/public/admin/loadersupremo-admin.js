// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2050 (ORDINE PERFETTO)
// Percorso reale: /app/public/admin/loadersupremo-admin.js
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER__) {
  window.__SUPREMO_ADMIN_LOADER__ = true;

  (function() {

    const V = "2050";

    // ============================================================
    // CACHE GLOBALE JS + LOCK ESECUZIONE
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_ADMIN_RUN_STATE__ = window.__SUPREMO_ADMIN_RUN_STATE__ || {
      running: false,
      done: false
    };

    // Anti doppio loader universale admin
    window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = false;

    console.log("⚡ [SUPREMO ADMIN 2050] In attesa di critical-core-ready...");

    // ============================================================
    // Utility caricamento script (SAFE, con debug)
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [LOAD-SKIP già caricato]", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [LOAD-REQUEST]", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;
        s.fetchPriority = "high";

        s.onload = () => {
          console.log("✅ [LOAD-OK]", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [LOAD-FAIL]", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // Import debug (con cache)
    // ============================================================
    async function debugImport(src) {
      const key = src + "::import";

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [IMPORT-SKIP già importato]", src);
        return;
      }

      try {
        await import(src + "?v=" + V);
        console.log("📦 [IMPORT-OK]", src);
        window.__SUPREMO_JS_CACHE__.add(key);
      } catch (e) {
        console.warn("📦❌ [IMPORT-FAIL]", src, e.message);
      }
    }

    // ============================================================
    // PATCH 2050 — rileva JS di pagina (DOM-SAFE)
    // ============================================================
    function paginaAdminHaJsDiPagina() {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo-admin")) continue;
        if (src.includes("loader.js")) continue;
        if (src.includes("loader-universale-admin")) continue;

        return true; // trovato JS di pagina admin
      }

      return false;
    }

    // ============================================================
    // Quando critical-core-ready è emesso → parte la sequenza
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {

      const state = window.__SUPREMO_ADMIN_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già completata, skip.");
        return;
      }
      if (state.running) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già in esecuzione, skip.");
        return;
      }

      state.running = true;

      console.log("🟦 [SUPREMO ADMIN 2050] critical-core-ready ricevuto");

      // ============================================================
      // 1) AUTH
      // ============================================================
      console.log("🔐 [SUPREMO ADMIN] Carico auth.js");
      await loadScript("/auth.js");
      await debugImport("/auth.js");

      // ============================================================
      // 2) JS GLOBALI ADMIN
      // ============================================================
      const path = window.location.pathname;

      const needSEO =
        path.includes("dashboard") ||
        path.includes("admin-prodotti") ||
        path.includes("admin-confronto");

      const needStructured =
        path.includes("admin-prodotti") ||
        path.includes("dashboard-vendite");

      if (needSEO) {
        console.log("🌐 [SUPREMO ADMIN] Carico seo-admin.js");
        await loadScript("/admin/seo-admin.js");
        await debugImport("/admin/seo-admin.js");
      }

      if (needStructured) {
        console.log("🌐 [SUPREMO ADMIN] Carico structured-data-admin.js");
        await loadScript("/admin/structured-data-admin.js");
        await debugImport("/admin/structured-data-admin.js");
      }

      // ============================================================
      // 3) HEADER ADMIN
      // ============================================================
      console.log("📌 [SUPREMO ADMIN] Carico header-admin.js");
      await loadScript("/admin/header-admin.js", "body");
      await debugImport("/admin/header-admin.js");

      // ============================================================
      // 4) LOADER UNIVERSALE ADMIN — PATCH DOM-SAFE
      // ============================================================
      await new Promise(r => setTimeout(r, 0)); // lascia finire parsing DOM

      if (paginaAdminHaJsDiPagina()) {
        if (!window.__LOADER_UNIVERSALE_ADMIN_CARICATO__) {
          window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = true;
          console.log("📦 [SUPREMO ADMIN] Carico loader-universale-admin.js (pagina con JS)");
          await loadScript("/admin/loader-universale-admin.js");
          await debugImport("/admin/loader-universale-admin.js");
        } else {
          console.log("⏭️ loader-universale-admin.js già caricato");
        }
      } else {
        console.log("📦 [SUPREMO ADMIN] Pagina SENZA JS → loader-universale-admin.js NON caricato");
      }

      // ============================================================
      // 5) Attesa page-js-loaded
      // ============================================================
      console.log("📄 [SUPREMO ADMIN] In attesa di page-js-loaded...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });
      console.log("📄 [SUPREMO ADMIN] page-js-loaded ricevuto");

      // ============================================================
      // 6) DYNAMIC ADMIN LOADER
      // ============================================================
      console.log("🔄 [SUPREMO ADMIN] Carico dynamic-admin-loader.js");
      await loadScript("/admin/dynamic-admin-loader.js");
      await debugImport("/admin/dynamic-admin-loader.js");

      // ============================================================
      // 7) CRITICAL READY FINALE
      // ============================================================
      console.log("🟩 [SUPREMO ADMIN] critical-ready (ORDINE PERFETTO)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));

      state.running = false;
      state.done = true;
    });

  })();
} else {
  console.warn("SUPREMO ADMIN già caricato, skip.");
}
