// =========================================================
// LOADER UNIVERSALE PUBLIC — PATCH 2058 (JAVA-MODE READY)
// Carica il JS di pagina in base a window.__PAGE_ID__
// Emissione evento: page-js-loaded
// Percorso atteso JS pagina: /js/pagine/{page}.js
// =========================================================

if (!window.__LOADER_UNIVERSALE_PUBLIC_2058__) {
  window.__LOADER_UNIVERSALE_PUBLIC_2058__ = true;

  console.log("⚡ [UNIVERSALE PUBLIC 2058] Loader universale attivo");

  (function () {

    const VERSION = "2058";

    window.__UNIVERSALE_PUBLIC_JS_CACHE__ =
      window.__UNIVERSALE_PUBLIC_JS_CACHE__ || new Set();

    window.__UNIVERSALE_PUBLIC_RUN_STATE__ =
      window.__UNIVERSALE_PUBLIC_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

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

    function getPageBaseFromPath() {
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

    function getPageId() {
      if (typeof window.__PAGE_ID__ === "string" && window.__PAGE_ID__.trim()) {
        return normalizeName(window.__PAGE_ID__);
      }
      return getPageBaseFromPath();
    }

    function getExpectedPageScript() {
      const base = getPageId();
      return {
        base,
        src: `/js/pagine/${base}.js`
      };
    }

    // ============================================================
    // CARICA SCRIPT (SAFE)
    // ============================================================
    function loadScript(src) {
      const key = src;

      if (window.__UNIVERSALE_PUBLIC_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE PUBLIC] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE PUBLIC] LOAD-REQUEST", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${VERSION}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE PUBLIC] LOAD-OK", key);
          window.__UNIVERSALE_PUBLIC_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE PUBLIC] LOAD-FAIL", key);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // CARICA JS DI PAGINA SE NON È GIÀ PRESENTE
    // ============================================================
    async function loadPageScriptIfNeeded(expectedSrc) {
      if (
        document.querySelector(`script[src="${expectedSrc}?v=${VERSION}"]`) ||
        document.querySelector(`script[src="${expectedSrc}"]`)
      ) {
        console.log(`⏭️ [UNIVERSALE PUBLIC] Script pagina già nel DOM → skip: ${expectedSrc}`);
        return true;
      }

      console.log(`📦 [UNIVERSALE PUBLIC] Script pagina NON presente → loader: ${expectedSrc}`);
      return await loadScript(expectedSrc);
    }

    // ============================================================
    // AVVIO LOADER UNIVERSALE
    // ============================================================
    async function runUniversale() {
      const state = window.__UNIVERSALE_PUBLIC_RUN_STATE__;

      if (state.done || state.running) return;

      state.running = true;

      console.log("🟦 [UNIVERSALE PUBLIC] Evento supremo-public-load-universale → avvio");

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 Pagina normalizzata:", base);
      console.log("🔍 Script atteso:", expectedPageScript);

      await loadPageScriptIfNeeded(expectedPageScript);

      state.running = false;
      state.done = true;

      if (!window.__pageJsLoaded) {
        console.log("🟩 [UNIVERSALE PUBLIC] page-js-loaded");
        window.__pageJsLoaded = true;
        document.dispatchEvent(new Event("page-js-loaded"));
      }
    }

    // ============================================================
    // LISTENER DA SUPREMO
    // ============================================================
    document.addEventListener("supremo-public-load-universale", runUniversale);

  })();
}
