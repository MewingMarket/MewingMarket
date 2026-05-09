// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2040 (ORDINE PERFETTO)
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER__) {
  window.__SUPREMO_ADMIN_LOADER__ = true;

  (function() {

    const V = "2038";

    console.log("⚡ [SUPREMO ADMIN 2040] In attesa di critical-core-ready...");

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${src}?v=${V}`;
        s.async = true;
        s.fetchPriority = "high";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // Quando critical-core-ready è emesso → parte la sequenza
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {

      console.log("🟦 [SUPREMO ADMIN 2040] critical-core-ready ricevuto");

      // 1) AUTH (se non già caricato)
      if (!window.__AUTH_LOADED__) {
        console.log("🔐 [SUPREMO ADMIN] Carico auth.js");
        await loadScript("/auth.js");
      }

      // 2) JS GLOBALI ADMIN
      console.log("🌐 [SUPREMO ADMIN] Carico JS globali admin");
      await loadScript("/admin/seo-admin.js");
      await loadScript("/admin/structured-data-admin.js");

      // 3) HEADER ADMIN JS (se esiste)
      console.log("📌 [SUPREMO ADMIN] Carico header-admin.js (se presente)");
      await loadScript("/admin/header-admin.js", "body");

      // 4) LOADER UNIVERSALE 2038
      console.log("📦 [SUPREMO ADMIN] Carico loader-universale-2038");
      await loadScript("/loader-universale-2038.js");

      // 5) Aspetta che loader universale carichi JS pagina admin
      console.log("📄 [SUPREMO ADMIN] In attesa che il loader universale carichi JS pagina...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });

      // 6) DYNAMIC ADMIN LOADER
      console.log("🔄 [SUPREMO ADMIN] Carico dynamic-admin-loader.js");
      await loadScript("/admin/dynamic-admin-loader.js");

      // 7) CRITICAL READY FINALE
      console.log("🟩 [SUPREMO ADMIN] critical-ready (ORDINE PERFETTO)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
    });

  })();
} else {
  console.warn("loadersupremo-admin.js già caricato, skip.");
}
