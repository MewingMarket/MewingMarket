// =========================================================
// LOADER SUPREMO — MODELLO 2040 (ORDINE PERFETTO)
// =========================================================

if (!window.__SUPREMO_LOADED__) {
  window.__SUPREMO_LOADED__ = true;

  (function() {

    const V = "2038";

    console.log("⚡ [SUPREMO 2040] In attesa di critical-core-ready...");

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
    // Quando critical-core-ready è emesso → parte la sequenza
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {

      console.log("🟦 [SUPREMO 2040] critical-core-ready ricevuto");

      // 1) AUTH (se non già caricato)
      if (!window.__AUTH_LOADED__) {
        console.log("🔐 [SUPREMO] Carico auth.js");
        await loadScript("/auth.js");
      }

      // 2) JS GLOBALI
      console.log("🌐 [SUPREMO] Carico JS globali");
      await loadScript("/seo.js");
      await loadScript("/structured-data.js");
      await loadScript("/tracking.js");
      await loadScript("/header.js", "body");

      // 3) CARRELLO (solo dove serve)
      if (shouldLoadCarrello()) {
        console.log("🛒 [SUPREMO] Carico carrello.js");
        await loadScript("/carrello.js", "body");
      } else {
        console.log("🛒 [SUPREMO] Carrello NON necessario in questa pagina");
      }

      // 4) LOADER UNIVERSALE 2038
      console.log("📦 [SUPREMO] Carico loader-universale-2038");
      await loadScript("/loader-universale-2038.js");

      // 5) Aspetta che loader universale carichi JS pagina
      console.log("📄 [SUPREMO] In attesa che il loader universale carichi JS pagina...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });

      // 6) DYNAMIC LOADER
      console.log("🔄 [SUPREMO] Carico dynamic-loader.js");
      await loadScript("/dynamic-loader.js");

      // 7) CRITICAL READY FINALE
      console.log("🟩 [SUPREMO] critical-ready (ORDINE PERFETTO)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
    });

  })();
} else {
  console.warn("SUPREMO già caricato, skip.");
}
