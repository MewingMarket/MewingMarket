// =========================================================
// LOADER SUPREMO — PUBLIC MODELLO 2061 ULTRA-SAFE
// - Nessun override globale (createElement/fetch/dispatchEvent)
// - Nessun Set/Map infinita
// - Sequenza deterministica di sotto-loader
// - Timeout per script, senza memory leak
// =========================================================

(function () {
  if (window.__SUPREMO_PUBLIC_2061__) return;
  window.__SUPREMO_PUBLIC_2061__ = true;

  const V = "2061";
  const SCRIPT_TIMEOUT_MS = 8000;

  console.log("⚡ [SUPREMO PUBLIC 2061] Avvio SUPREMO PUBLIC ULTRA-SAFE");

  // Cache minimale per evitare doppi load nella stessa pagina
  const loadedScripts = new Set();

  function loadScript(src, timeoutMs = SCRIPT_TIMEOUT_MS) {
    const key = src;

    if (loadedScripts.has(key)) {
      console.log("⏭️ [SUPREMO PUBLIC] LOAD-SKIP (già caricato):", key);
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      console.log("➡️ [SUPREMO PUBLIC] LOAD-REQUEST:", key);

      const s = document.createElement("script");
      s.src = `${key}?v=${V}`;
      s.async = false;

      let settled = false;
      let timeoutId = null;

      function done(ok) {
        if (settled) return;
        settled = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (ok) {
          console.log("✅ [SUPREMO PUBLIC] LOAD-OK:", key);
          loadedScripts.add(key);
        } else {
          console.warn("❌ [SUPREMO PUBLIC] LOAD-FAIL/TIMEOUT:", key);
        }

        resolve(ok);
      }

      s.onload = () => done(true);
      s.onerror = () => done(false);

      timeoutId = setTimeout(() => {
        console.warn("⏰ [SUPREMO PUBLIC] TIMEOUT:", key);
        done(false);
      }, timeoutMs);

      (document.head || document.documentElement || document.body).appendChild(s);
    });
  }

  async function runSupremoPublic() {
    if (window.__SUPREMO_PUBLIC_RUNNING__) return;
    window.__SUPREMO_PUBLIC_RUNNING__ = true;

    console.log("🟦 [SUPREMO PUBLIC 2061] Sequenza SUPREMO avviata");

    // 1) CRITICAL LOADER
    await loadScript("/loader.js");

    // 2) CSS LOADER
    await loadScript("/cssloader.js");
    try {
      document.dispatchEvent(new Event("supremo-public-load-css"));
    } catch (e) {
      console.warn("⚠️ [SUPREMO PUBLIC 2061] Event supremo-public-load-css non emesso:", e.message);
    }

    // 3) GLOBAL LOADER
    await loadScript("/global-loader.js");

    // 3.bis) GLOBAL PUBLIC (tracking/structured/carrello) — NON BLOCCANTE
    if (typeof window.__runGlobalPublic2058 === "function") {
      console.log("🟦 [SUPREMO PUBLIC 2061] Avvio __runGlobalPublic2058() (NON BLOCCANTE)");
      try {
        window.__runGlobalPublic2058();
      } catch (err) {
        console.error("❌ [SUPREMO PUBLIC 2061] Errore in __runGlobalPublic2058:", err);
      }
    } else {
      console.warn("⚠️ [SUPREMO PUBLIC 2061] __runGlobalPublic2058 non trovato");
    }

    // 4) DYNAMIC LOADER
    await loadScript("/dynamic-loader.js");
    console.log("🟦 [SUPREMO PUBLIC 2061] Dynamic Loader caricato");

    // 5) LOADER UNIVERSALE
    await loadScript("/loaderuniversale.js");
    try {
      document.dispatchEvent(new Event("supremo-public-load-universale"));
    } catch (e) {
      console.warn("⚠️ [SUPREMO PUBLIC 2061] Event supremo-public-load-universale non emesso:", e.message);
    }

    // 6) CRITICAL READY — SOLO QUI
    if (!window.__criticalReady) {
      window.__criticalReady = true;
      try {
        document.dispatchEvent(new Event("critical-ready"));
        console.log("🟩 [SUPREMO PUBLIC 2061] critical-ready EMESSO");
      } catch (e) {
        console.warn("⚠️ [SUPREMO PUBLIC 2061] critical-ready non emesso:", e.message);
      }
    }

    console.log("🟩 [SUPREMO PUBLIC 2061] Sequenza completata");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runSupremoPublic, { once: true });
  } else {
    runSupremoPublic();
  }
})();
