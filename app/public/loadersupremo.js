// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2050 (ORDINE PERFETTO)
// =========================================================

if (!window.__SUPREMO_LOADED__) {
  window.__SUPREMO_LOADED__ = true;

  (function() {

    const V = "2050";

    console.log("⚡ [SUPREMO PUBLIC 2050] In attesa di critical-core-ready...");

    // ============================================================
    // Utility caricamento script (SAFE, con debug)
    // ============================================================
    function loadScript(src, where = "head") {
      return new Promise(resolve => {
        console.log("➡️ [LOAD-REQUEST]", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${V}`;
        s.defer = true; // FIX: niente async
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
    // Carica carrello solo su index / catalogo / prodotto
    // ============================================================
    function shouldLoadCarrello() {
      const p = window.location.pathname;
      return (
        p === "/" ||
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto")
      );
    }

    // ============================================================
    // SEO e Structured-data solo dove servono
    // ============================================================
    function needSEO() {
      const p = window.location.pathname;
      return (
        p === "/" ||
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto") ||
        p.includes("top-recensioni") ||
        p.includes("guide") ||
        p.includes("FAQ") ||
        p.includes("assistenza")
      );
    }

    function needStructured() {
      const p = window.location.pathname;
      return (
        p.includes("catalogo") ||
        p.includes("prodotto") ||
        p.includes("recensioni")
      );
    }

    // ============================================================
    // Quando critical-core-ready è emesso → parte la sequenza
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {

      console.log("🟦 [SUPREMO PUBLIC 2050] critical-core-ready ricevuto");

      // ============================================================
      // 1) AUTH (sempre primo)
      // ============================================================
      console.log("🔐 [SUPREMO] Carico auth.js");
      await loadScript("/auth.js");
      await debugImport("/auth.js");

      // ============================================================
      // 2) JS GLOBALI (SEO/structured solo se servono)
      // ============================================================
      if (needSEO()) {
        console.log("🌐 [SUPREMO] Carico seo.js");
        await loadScript("/seo.js");
        await debugImport("/seo.js");
      } else {
        console.log("🌐 [SUPREMO] SEO NON necessario");
      }

      if (needStructured()) {
        console.log("🌐 [SUPREMO] Carico structured-data.js");
        await loadScript("/structured-data.js");
        await debugImport("/structured-data.js");
      } else {
        console.log("🌐 [SUPREMO] Structured-data NON necessario");
      }

      console.log("📊 [SUPREMO] Carico tracking.js");
      await loadScript("/tracking.js");
      await debugImport("/tracking.js");

      console.log("📌 [SUPREMO] Carico header.js");
      await loadScript("/header.js", "body");
      await debugImport("/header.js");

      // ============================================================
      // 3) CARRELLO (solo dove serve)
      // ============================================================
      if (shouldLoadCarrello()) {
        console.log("🛒 [SUPREMO] Carico carrello.js");
        await loadScript("/carrello.js", "body");
        await debugImport("/carrello.js");
      } else {
        console.log("🛒 [SUPREMO] Carrello NON necessario");
      }

      // ============================================================
      // 4) LOADER UNIVERSALE PUBLIC 2038
      // ============================================================
      console.log("📦 [SUPREMO] Carico loader-universale-2038");
      await loadScript("/loader-universale-2038.js");
      await debugImport("/loader-universale-2038.js");

      // ============================================================
      // 5) Attesa caricamento JS pagina
      // ============================================================
      console.log("📄 [SUPREMO] In attesa di page-js-loaded...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });
      console.log("📄 [SUPREMO] page-js-loaded ricevuto");

      // ============================================================
      // 6) DYNAMIC LOADER
      // ============================================================
      console.log("🔄 [SUPREMO] Carico dynamic-loader.js");
      await loadScript("/dynamic-loader.js");
      await debugImport("/dynamic-loader.js");

      // ============================================================
      // 7) CRITICAL READY FINALE
      // ============================================================
      console.log("🟩 [SUPREMO] critical-ready (ORDINE PERFETTO)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
    });

  })();
} else {
  console.warn("SUPREMO già caricato, skip.");
}
