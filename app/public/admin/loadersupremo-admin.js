// =========================================================
// LOADER SUPREMO — ADMIN
// Carica critical loader admin + loader universale + dynamic admin
// =========================================================

// Protezione anti-doppio-caricamento
(function(name){
  window.__LOADER_GUARD__ = window.__LOADER_GUARD__ || {};
  if (window.__LOADER_GUARD__[name]) {
    console.warn(name + " già caricato, skip.");
    return;
  }
  window.__LOADER_GUARD__[name] = true;
})("loadersupremo-admin.js");

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
