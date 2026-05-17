// =========================================================
// LOADER UNIVERSALE PUBLIC — SLEEP MODE 2056
// File completo ma DISATTIVATO di default.
// Attivabile impostando: window.__ENABLE_UNIVERSALE_FALLBACK__ = true
// =========================================================

if (!window.__LOADER_UNIVERSALE_PUBLIC_2056__) {
  window.__LOADER_UNIVERSALE_PUBLIC_2056__ = true;

  console.log("⚡ [UNIVERSALE PUBLIC 2056] Loader universale caricato (SLEEP MODE)");

  // ============================================================
  // FLAG DI ATTIVAZIONE (default: OFF)
  // ============================================================
  if (!window.__ENABLE_UNIVERSALE_FALLBACK__) {
    console.log("⏭️ [UNIVERSALE PUBLIC 2056] Fallback disattivato → nessuna azione");
    document.addEventListener("supremo-public-load-universale", () => {
      console.log("⏭️ [UNIVERSALE PUBLIC 2056] Evento ricevuto → fallback DISATTIVATO");
    });
    return; // 🔥 STOP: nessuna logica eseguita
  }

  // ============================================================
  // DA QUI IN POI: fallback attivo SOLO se __ENABLE_UNIVERSALE_FALLBACK__ = true
  // ============================================================

  (function () {

    const VERSION = "2056";

    window.__UNIVERSALE_PUBLIC_JS_CACHE__ =
      window.__UNIVERSALE_PUBLIC_JS_CACHE__ || new Set();

    window.__UNIVERSALE_PUBLIC_RUN_STATE__ =
      window.__UNIVERSALE_PUBLIC_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__pageJsLoaded = window.__pageJsLoaded || false;

    console.log("🟦 [UNIVERSALE PUBLIC 2056] Fallback ATTIVO");

    // ============================================================
    // NORMALIZZAZIONE
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
    // FALLBACK: CARICA JS DI PAGINA SOLO SE NON È GIÀ NEL DOM
    // ============================================================
    async function loadPageScriptIfNeeded(expectedSrc) {

      if (
        document.querySelector(`script[src="${expectedSrc}?v=${VERSION}"]`) ||
        document.querySelector(`script[src="${expectedSrc}"]`)
      ) {
        console.log(`⏭️ [UNIVERSALE PUBLIC] Script pagina già nel DOM → skip: ${expectedSrc}`);
        return true;
      }

      console.log(`📦 [UNIVERSALE PUBLIC] Script pagina NON presente → fallback loader: ${expectedSrc}`);
      return await loadScript(expectedSrc);
    }

    // ============================================================
    // AVVIO FALLBACK
    // ============================================================
    async function runUniversale() {
      const state = window.__UNIVERSALE_PUBLIC_RUN_STATE__;

      if (state.done || state.running) return;

      state.running = true;

      console.log("🟦 [UNIVERSALE PUBLIC] Evento supremo-public-load-universale → avvio fallback");

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 Pagina normalizzata:", base);
      console.log("🔍 Script atteso:", expectedPageScript);

      await loadPageScriptIfNeeded(expectedPageScript);

      state.running = false;
      state.done = true;

      if (!window.__pageJsLoaded) {
        console.log("🟩 [UNIVERSALE PUBLIC] page-js-loaded (fallback)");
        window.__pageJsLoaded = true;
        document.dispatchEvent(new Event("page-js-loaded"));
      }
    }

    // ============================================================
    // LISTENER
    // ============================================================
    document.addEventListener("supremo-public-load-universale", runUniversale);

  })();
}
