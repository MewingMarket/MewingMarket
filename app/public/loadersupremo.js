// =========================================================
// LOADER SUPREMO — GLOBAL ULTRA FAST
// Caricamento immediato, parallelo, priorità massima
// =========================================================

if (!window.__SUPREMO_LOADED__) {
  window.__SUPREMO_LOADED__ = true;

  (function() {

    const V = "2038";

    const scripts = [
      `/loader.js?v=${V}`,
      `/loader-universale-2030.js?v=${V}`,
      `/dynamic-loader.js?v=${V}`
    ];

    // 1) Preload aggressivo + priorità massima
    scripts.forEach(src => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = src;
      link.fetchPriority = "high";
      document.head.appendChild(link);
    });

    // 2) Caricamento parallelo immediato (senza defer)
    Promise.all(
      scripts.map(src => {
        return new Promise(resolve => {
          const s = document.createElement("script");
          s.src = src;
          s.async = true;              // ⚡ massimo parallelismo
          s.fetchPriority = "high";    // ⚡ priorità massima
          s.onload = resolve;
          s.onerror = resolve;
          document.head.appendChild(s);
        });
      })
    ).then(() => {
      console.log("⚡ [SUPREMO ULTRA FAST] Tutti i loader caricati");
    });

  })();
} else {
  console.warn("SUPREMO già caricato, skip.");
}
