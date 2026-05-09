// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2050 (ORDINE PERFETTO)
// Percorso reale: /app/public/admin/loadersupremo-admin.js
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER__) {
  window.__SUPREMO_ADMIN_LOADER__ = true;

  (function() {

    const V = "2050";

    console.log("⚡ [SUPREMO ADMIN 2050] In attesa di critical-core-ready...");

    // ============================================================
    // Utility caricamento script (SAFE, con debug)
    // ============================================================
    function loadScript(src, where = "head") {
      return new Promise(resolve => {
        console.log("➡️ [LOAD-REQUEST]", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${V}`;
        s.defer = true;
        s.fetchPriority = "high";

        s.onload = () => {
          console.log("✅ [LOAD-OK]", src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [LOAD-FAIL]", src);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // Import debug (per capire se il JS è eseguibile)
    // ============================================================
    async function debugImport(src) {
      try {
        await import(src + "?v=" + V);
        console.log("📦 [IMPORT-OK]", src);
      } catch (e) {
        console.warn("📦❌ [IMPORT-FAIL]", src, e.message);
      }
    }

    // ============================================================
    // Quando critical-core-ready è emesso → parte la sequenza
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {

      console.log("🟦 [SUPREMO ADMIN 2050] critical-core-ready ricevuto");

      // ============================================================
      // 1) AUTH (sempre primo)
      // ============================================================
      console.log("🔐 [SUPREMO ADMIN] Carico auth.js");
      await loadScript("/auth.js");
      await debugImport("/auth.js");

      // ============================================================
      // 2) JS GLOBALI ADMIN (SEO/structured solo se servono)
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
      } else {
        console.log("🌐 [SUPREMO ADMIN] SEO admin NON necessario");
      }

      if (needStructured) {
        console.log("🌐 [SUPREMO ADMIN] Carico structured-data-admin.js");
        await loadScript("/admin/structured-data-admin.js");
        await debugImport("/admin/structured-data-admin.js");
      } else {
        console.log("🌐 [SUPREMO ADMIN] Structured-data admin NON necessario");
      }

      // ============================================================
      // 3) HEADER ADMIN JS
      // ============================================================
      console.log("📌 [SUPREMO ADMIN] Carico header-admin.js");
      await loadScript("/admin/header-admin.js", "body");
      await debugImport("/admin/header-admin.js");

      // ============================================================
      // 4) LOADER UNIVERSALE ADMIN 2050 (nome reale)
      // ============================================================
      console.log("📦 [SUPREMO ADMIN] Carico loader-universale-admin.js");
      await loadScript("/admin/loader-universale-admin.js");
      await debugImport("/admin/loader-universale-admin.js");

      // ============================================================
      // 5) Attesa caricamento JS pagina admin
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
    });

  })();
} else {
  console.warn("SUPREMO ADMIN già caricato, skip.");
}
