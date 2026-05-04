// =========================================================
// LOADER SUPREMO — ADMIN
// Carica critical loader admin + loader universale + dynamic admin
// =========================================================

// Guardia anti-doppio-caricamento SEMPLICE (senza return illegale)
if (window.__SUPREMO_ADMIN_LOADER__) {
  console.warn("loadersupremo-admin.js già caricato, skip.");
} else {
  window.__SUPREMO_ADMIN_LOADER__ = true;

  (function() {

    const V = "2038";

    function load(src) {
      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${src}?v=${V}`;
        s.defer = true;
        s.onload = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
      });
    }

    async function start() {

      // 1) Critical loader admin
      await load("/admin/loader-admin.js");

      // 2) Loader universale (2038 dentro 2030)
      await load("/loader-universale-2030.js");

      // 3) Dynamic admin loader (se esiste)
      await load("/admin/dynamic-admin-loader.js");

      console.log("[SUPREMO ADMIN] Tutti i loader caricati");
    }

    start();

  })();
}
