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

    // Patch anti-doppio loader universale
    window.__LOADER_UNIVERSALE_CARICATO__ = false;

    console.log("⚡ [SUPREMO PUBLIC 2050] Bootstrap avviato");

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
    // Import debug
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
    function paginaHaJsDiPagina() {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo")) continue;
        if (src.includes("loader.js")) continue;
        if (src.includes("loadersupremo-admin")) continue;
        if (src.includes("loaderuniversale")) continue;

        return true;
      }

      return false;
    }

    // ============================================================
    // Carrello solo dove serve
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
    // SEO / Structured
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
    // 0) Critical loader
    // ============================================================
    (async () => {
      console.log("📌 [SUPREMO] Carico critical loader PUBLIC: /loader.js");
      await loadScript("/loader.js");
      await debugImport("/loader.js");

      console.log("⏳ [SUPREMO] In attesa di critical-core-ready...");
    })();

    // ============================================================
    // Sequenza PUBLIC
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.done) return console.log("⏭️ Sequenza già completata");
      if (state.running) return console.log("⏭️ Sequenza già in esecuzione");

      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2050] critical-core-ready ricevuto");

      // 1) AUTH
      console.log("🔐 [SUPREMO] Carico auth.js");
      await loadScript("/auth.js");
      await debugImport("/auth.js");

      // 2) SEO / Structured
      if (needSEO()) {
        console.log("🌐 Carico seo.js");
        await loadScript("/seo.js");
        await debugImport("/seo.js");
      }

      if (needStructured()) {
        console.log("🌐 Carico structured-data.js");
        await loadScript("/structured-data.js");
        await debugImport("/structured-data.js");
      }

      console.log("📊 Carico tracking.js");
      await loadScript("/tracking.js");
      await debugImport("/tracking.js");

      console.log("📌 Carico header.js");
      await loadScript("/header.js", "body");
      await debugImport("/header.js");

      // 3) Carrello
      if (shouldLoadCarrello()) {
        console.log("🛒 Carico carrello.js");
        await loadScript("/carrello.js", "body");
        await debugImport("/carrello.js");
      }

      // ============================================================
      // 4) LOADER UNIVERSALE — PATCH DOM-SAFE + EVENTO DEDICATO
      // ============================================================
      await new Promise(r => setTimeout(r, 0)); // lascia finire parsing DOM

      if (paginaHaJsDiPagina()) {
        if (!window.__LOADER_UNIVERSALE_CARICATO__) {
          window.__LOADER_UNIVERSALE_CARICATO__ = true;

          console.log("📦 Carico loaderuniversale.js (pagina con JS)");
          await loadScript("/loaderuniversale.js");

          // 🔥 Evento che FA PARTIRE l’universale PUBLIC
          document.dispatchEvent(new Event("supremo-public-load-universale"));
        }
      } else {
        console.log("📦 Pagina SENZA JS → loaderuniversale.js NON caricato");
      }

      // 5) Attesa page-js-loaded
      console.log("📄 In attesa di page-js-loaded...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });

      console.log("📄 page-js-loaded ricevuto");

      // 6) Dynamic loader
      console.log("🔄 Carico dynamic-loader.js");
      await loadScript("/dynamic-loader.js");
      await debugImport("/dynamic-loader.js");

      // 7) Critical ready finale
      console.log("🟩 critical-ready (ORDINE PERFETTO)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));

      state.running = false;
      state.done = true;
    });

  })();
} else {
  console.warn("SUPREMO PUBLIC 2050 già caricato, skip.");
}
