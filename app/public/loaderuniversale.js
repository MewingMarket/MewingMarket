// =========================================================
// LOADER UNIVERSALE PUBLIC — VERSIONE 2055 (FALLBACK MODE)
// Percorso reale: /app/public/loaderuniversale.js
// Ruolo: SOLO FALLBACK, attivato dal SUPREMO PUBLIC
// =========================================================

if (window.__LOADER_UNIVERSALE_PUBLIC_2055__) {
  console.warn("[UNIVERSALE PUBLIC 2055] Già caricato → skip");
} else {
  window.__LOADER_UNIVERSALE_PUBLIC_2055__ = true;

  (function () {

    const VERSION = "2055";

    // Cache locale per gli script caricati dall’universale
    window.__UNIVERSALE_PUBLIC_JS_CACHE__ =
      window.__UNIVERSALE_PUBLIC_JS_CACHE__ || new Set();

    // Stato esecuzione universale (solo fallback)
    window.__UNIVERSALE_PUBLIC_RUN_STATE__ =
      window.__UNIVERSALE_PUBLIC_RUN_STATE__ || {
        running: false,
        done: false
      };

    // Flag globali
    window.__pageJsLoaded = window.__pageJsLoaded || false;

    console.log("⚡ [UNIVERSALE PUBLIC 2055] Avvio loader universale PUBLIC (FALLBACK MODE)");

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
    // CARICA SCRIPT (SAFE + CACHE LOCALE)
    // ============================================================
    function loadScript(src) {
      const key = src;

      if (window.__UNIVERSALE_PUBLIC_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE PUBLIC] LOAD-SKIP già caricato:", key);
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
    // AVVIO (CON LOCK LOCALE)
    // ============================================================
    async function runUniversale() {
      const state = window.__UNIVERSALE_PUBLIC_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [UNIVERSALE PUBLIC] run() già completato → skip");
        return;
      }
      if (state.running) {
        console.log("⏭️ [UNIVERSALE PUBLIC] run() già in esecuzione → skip");
        return;
      }

      state.running = true;

      console.log("🟦 [UNIVERSALE PUBLIC] Evento supremo-public-load-universale ricevuto → avvio run()");

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 [UNIVERSALE PUBLIC] Pagina normalizzata:", base);
      console.log("🔍 [UNIVERSALE PUBLIC] Script pagina atteso:", expectedPageScript);

      await loadPageScriptIfNeeded(expectedPageScript);

      state.running = false;
      state.done = true;

      // Evita doppie emissioni
      if (!window.__pageJsLoaded) {
        console.log("🟩 [UNIVERSALE PUBLIC] page-js-loaded (fallback universale)");
        window.__pageJsLoaded = true;
        document.dispatchEvent(new Event("page-js-loaded"));
      } else {
        console.log("🟩 [UNIVERSALE PUBLIC] page-js-loaded era già presente → nessuna emissione");
      }
    }

    // ============================================================
    // PATCH 2055: ascolta SOLO l’evento del SUPREMO PUBLIC
    // ============================================================
    document.addEventListener("supremo-public-load-universale", runUniversale);

  })();
}
