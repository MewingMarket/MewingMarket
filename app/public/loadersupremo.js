// =========================================================
// LOADER SUPREMO — GLOBAL
// Carica critical loader + loader universale + dynamic loader
// =========================================================

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

    // 1) Critical loader pubblico
    await load("/loader.js");

    // 2) Loader universale (2038 dentro 2030)
    await load("/loader-universale-2030.js");

    // 3) Dynamic loader (se esiste)
    await load("/dynamic-loader.js");

    console.log("[SUPREMO] Tutti i loader caricati");
  }

  start();

})();
