// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2055 (ORDINE PERFETTO)
// Percorso reale: /app/public/loadersupremo.js
// =========================================================

if (!window.__SUPREMO_PUBLIC_2055__) {
  window.__SUPREMO_PUBLIC_2055__ = true;

  (function () {

    const V = "2055";

    // ============================================================
    // CACHE + LOCK
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_PUBLIC_RUN_STATE__ =
      window.__SUPREMO_PUBLIC_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__LOADER_UNIVERSALE_CARICATO__ =
      window.__LOADER_UNIVERSALE_CARICATO__ || false;

    // Flag globali di stato pagina
    window.__pageJsLoaded = window.__pageJsLoaded || false;
    window.__criticalReady = window.__criticalReady || false;

    console.log("⚡ [SUPREMO PUBLIC 2055] Inizializzazione SUPREMO...");

    // ============================================================
    // Utility caricamento script (deterministico)
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
    // NORMALIZZAZIONE NOME PAGINA
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/\.js$/, "")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .trim();
    }

    function getPageBase() {
      const p = window.location.pathname;

      if (p === "/" || p === "") return "index";

      const parts = p.split("/").filter(Boolean);

      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      if (parts.length >= 2 && !parts[parts.length - 1].includes(".")) {
        return normalizeName(parts.join("-"));
      }

      return normalizeName(parts.pop());
    }

    function getExpectedPageScript() {
      const base = getPageBase();
      return {
        base,
        src: `/${base}.js`
      };
    }

    // ============================================================
    // Rileva se il JS pagina è già nel DOM
    // ============================================================
    function paginaHaJsDiPagina(expectedSrc) {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo")) continue;
        if (src.includes("loaderuniversale")) continue;
        if (src.includes("dynamic-loader")) continue;
        if (src.includes("loader.js")) continue;

        if (src === expectedSrc || src.startsWith(expectedSrc + "?")) {
          console.log("🔍 [SUPREMO PUBLIC] JS pagina già presente:", src);
          return true;
        }
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

      if (state.done && window.__pageJsLoaded && window.__criticalReady) {
        console.log("⏭️ [SUPREMO PUBLIC] Sequenza già completata (page-js + critical-ready)");
        return;
      }
      if (state.running) {
        console.log("⏭️ [SUPREMO PUBLIC] Sequenza già in esecuzione");
        return;
      }

      state.running = true;
      console.log("🟦 [SUPREMO PUBLIC 2055] Sequenza SUPREMO avviata");

      // 0) CRITICAL LOADER — SEMPRE PRIMA DI TUTTO
      console.log("🟦 [SUPREMO PUBLIC] Carico critical-loader-public.js");
      await loadScript("/critical-loader-public.js");

      console.log("🟦 [SUPREMO PUBLIC] Carico critical-loader-private.js");
      await loadScript("/critical-loader-private.js");

      // 1) AUTH
      console.log("🔐 [SUPREMO PUBLIC] Carico auth.js");
      await loadScript("/auth.js");

      // 2) SEO / Structured
      if (needSEO()) {
        console.log("🌐 [SUPREMO PUBLIC] Carico seo.js");
        await loadScript("/seo.js");
      }

      if (needStructured()) {
        console.log("🌐 [SUPREMO PUBLIC] Carico structured-data.js");
        await loadScript("/structured-data.js");
      }

      console.log("📊 [SUPREMO PUBLIC] Carico tracking.js");
      await loadScript("/tracking.js");

      console.log("📌 [SUPREMO PUBLIC] Carico header.js");
      await loadScript("/header.js", "body");

      // 3) Carrello
      if (shouldLoadCarrello()) {
        console.log("🛒 [SUPREMO PUBLIC] Carico carrello.js");
        await loadScript("/carrello.js", "body");
      }

      // 4) PAGE-JS: diretto o universale fallback
      await new Promise(r => setTimeout(r, 0));

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 [SUPREMO PUBLIC] Pagina normalizzata:", base);
      console.log("🔍 [SUPREMO PUBLIC] Script pagina atteso:", expectedPageScript);

      if (paginaHaJsDiPagina(expectedPageScript)) {
        // JS pagina già nel DOM → gestiamo bene lo skip
        console.log("📄 [SUPREMO PUBLIC] JS pagina già presente");

        // Se pagina davvero completa → skip universale
        if (window.__pageJsLoaded && window.__criticalReady) {
          console.log("📄 [SUPREMO PUBLIC] page-js-loaded + critical-ready già presenti → skip universale COMPLETO");
          state.running = false;
          state.done = true;
          return;
        }

        // Se manca critical-ready → NON fermarti, continua pipeline
        if (!window.__criticalReady) {
          console.warn("⚠️ [SUPREMO PUBLIC] JS pagina presente MA critical-ready mancante → continuo pipeline");
        }

        // Se manca page-js-loaded → emettilo ora
        if (!window.__pageJsLoaded) {
          console.log("🟩 [SUPREMO PUBLIC] page-js-loaded (diretto)");
          window.__pageJsLoaded = true;
          document.dispatchEvent(new Event("page-js-loaded"));
        }
      } else {
        // JS pagina NON presente → usa loader universale
        if (!window.__LOADER_UNIVERSALE_CARICATO__) {
          window.__LOADER_UNIVERSALE_CARICATO__ = true;

          console.log("📦 [SUPREMO PUBLIC] Carico loaderuniversale.js (fallback)");
          await loadScript("/loaderuniversale.js");

          document.dispatchEvent(new Event("supremo-public-load-universale"));
        }
      }

      // 5) Attesa page-js-loaded (solo se non già emesso)
      if (!window.__pageJsLoaded) {
        console.log("📄 [SUPREMO PUBLIC] In attesa di page-js-loaded...");
        await new Promise(resolve => {
          document.addEventListener("page-js-loaded", () => {
            window.__pageJsLoaded = true;
            resolve();
          }, { once: true });
        });
      } else {
        console.log("📄 [SUPREMO PUBLIC] page-js-loaded era già presente → nessuna attesa");
      }

      console.log("📄 [SUPREMO PUBLIC] page-js-loaded ricevuto");

      // 6) Dynamic loader (anti-cache / anti-SW)
      console.log("🔄 [SUPREMO PUBLIC] Carico dynamic-loader.js");
      await loadScript("/dynamic-loader.js");

      // 7) Critical ready finale (se non già emesso)
      if (!window.__criticalReady) {
        console.log("🟩 [SUPREMO PUBLIC 2055] critical-ready (emesso da SUPREMO)");
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
      } else {
        console.log("🟩 [SUPREMO PUBLIC 2055] critical-ready era già presente");
      }

      state.running = false;
      state.done = true;
    }

    // Trigger deterministico: DOM pronto
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
    } else {
      runSupremoPublic();
    }

  })();
} else {
  console.warn("SUPREMO PUBLIC 2055 già caricato, skip.");
}
