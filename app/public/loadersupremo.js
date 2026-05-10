// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2050 (ORDINE PERFETTO)
// Percorso reale: /app/public/loadersupremo.js
// =========================================================

if (!window.__SUPREMO_PUBLIC_2050__) {
  window.__SUPREMO_PUBLIC_2050__ = true;

  (function() {

    const V = "2050";

    // Cache globale degli script già caricati
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    // Stato esecuzione sequenza PUBLIC
    window.__SUPREMO_PUBLIC_RUN_STATE__ = window.__SUPREMO_PUBLIC_RUN_STATE__ || {
      running: false,
      done: false
    };

    console.log("⚡ [SUPREMO PUBLIC 2050] Bootstrap avviato");

    // ============================================================
    // Utility caricamento script (SAFE, con debug) — PATCH: async=false + CACHE
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src; // senza ?v

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
    // Import debug (per capire se il JS è eseguibile) — con cache
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
      const p = window.location.pathname.toLowerCase();
      return (
        p === "/" ||
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto") ||
        p.includes("top-recensioni") ||
        p.includes("guide") ||
        p.includes("faq") ||
        p.includes("assistenza")
      );
    }

    function needStructured() {
      const p = window.location.pathname.toLowerCase();
      return (
        p.includes("catalogo") ||
        p.includes("prodotto") ||
        p.includes("recensioni")
      );
    }

    // ============================================================
    // 0) CARICO IL CRITICAL LOADER PUBLIC (loader.js)
    // ============================================================
    (async () => {
      console.log("📌 [SUPREMO] Carico critical loader PUBLIC: /loader.js");
      await loadScript("/loader.js");
      await debugImport("/loader.js");

      console.log("⏳ [SUPREMO] In attesa di critical-core-ready...");
    })();

    // ============================================================
    // Quando critical-core-ready è emesso → parte la sequenza (con lock)
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [SUPREMO] Sequenza PUBLIC già completata, skip.");
        return;
      }
      if (state.running) {
        console.log("⏭️ [SUPREMO] Sequenza PUBLIC già in esecuzione, skip.");
        return;
      }

      state.running = true;

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
      // 4) LOADER UNIVERSALE PUBLIC (nome reale: loaderuniversale.js)
      // ============================================================
      console.log("📦 [SUPREMO] Carico loaderuniversale.js");
      await loadScript("/loaderuniversale.js");
      await debugImport("/loaderuniversale.js");

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

      state.running = false;
      state.done = true;
    });

  })();
} else {
  console.warn("SUPREMO PUBLIC 2050 già caricato, skip.");
}
