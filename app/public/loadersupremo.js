// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2056 (JAVA-MODE SAFE)
// =========================================================

if (!window.__SUPREMO_PUBLIC_2056__) {
  window.__SUPREMO_PUBLIC_2056__ = true;

  (function () {

    const V = "2056";

    // ============================================================
    // CACHE + LOCK
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || { running: false, done: false };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

    console.log("⚡ [SUPREMO PUBLIC 2056] Inizializzazione SUPREMO...");

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [SUPREMO PUBLIC] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO PUBLIC] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [SUPREMO PUBLIC] LOAD-OK:", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [SUPREMO PUBLIC] LOAD-FAIL:", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // RICONOSCIMENTO JS DI PAGINA
    // ============================================================
    function paginaHaJsDiPagina() {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo")) continue;
        if (src.includes("dynamic-loader")) continue;
        if (src.includes("loader.js")) continue;

        console.log("🔍 [SUPREMO PUBLIC] JS pagina rilevato:", src);
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
    // Sequenza PUBLIC controllata dal SUPREMO (Java-mode)
    // ============================================================
    async function runSupremoPublic() {
      const state = window.__SUPREMO_PUBLIC_RUN_STATE__;

      if (state.running || state.done) return;
      state.running = true;

      console.log("🟦 [SUPREMO PUBLIC 2056] Sequenza SUPREMO avviata");

      // ============================================================
      // 0) CRITICAL LOADER
      // ============================================================
      await loadScript("/loader.js");

      // ============================================================
      // 1) AUTH
      // ============================================================
      await loadScript("/auth.js");

      // ============================================================
      // 2) SEO / Structured
      // ============================================================
      if (needSEO()) await loadScript("/seo.js");
      if (needStructured()) await loadScript("/structured-data.js");

      await loadScript("/tracking.js");
      await loadScript("/header.js", "body");

      // ============================================================
      // 3) Carrello
      // ============================================================
      if (shouldLoadCarrello()) {
        await loadScript("/carrello.js", "body");
      }

      // ============================================================
      // 4) PAGE-JS
      // ============================================================
      await new Promise(r => setTimeout(r, 0));

      if (paginaHaJsDiPagina()) {
        if (!window.__pageJsLoaded) {
          window.__pageJsLoaded = true;
          document.dispatchEvent(new Event("page-js-loaded"));
        }
      }

      // ============================================================
      // 5) Dynamic loader (emette critical-ready)
      // ============================================================
      await loadScript("/dynamic-loader.js");

      // ❌ RIMOSSO: emissione critical-ready da SUPREMO
      // dynamic-loader.js ora è l’unica fonte di critical-ready

      state.running = false;
      state.done = true;
    }

    // Trigger
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
} else {
  console.warn("SUPREMO PUBLIC 2056 già caricato, skip.");
}
