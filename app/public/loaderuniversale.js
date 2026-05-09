// =========================================================
// LOADER UNIVERSALE 2030 — PUBLIC STATIC MAP MODE (ULTRA SAFE)
// Percorso reale: /app/public/loader-universale-2030.js
// =========================================================

if (window.__LOADER_UNIVERSALE_2030__) {
  console.warn("loader-universale-2030.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_2030__ = true;

  (function () {

    const VERSION = "2030";

    console.log("⚡ [UNIVERSALE 2030] Avvio loader universale PUBLIC (STATIC MAP)");

    // ============================================================
    // RETRY INTELLIGENTE — ULTRA FAST
    // ============================================================
    async function fetchWithRetry(url, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`➡️ [UNIVERSALE] Fetch ${url} (tentativo ${attempt})`);
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        } catch (e) {
          console.warn(`❌ [UNIVERSALE] FAIL ${url} (tentativo ${attempt})`, e.message);
          await new Promise(r => setTimeout(r, attempt * 150));
        }
      }
      console.error("🟥 [UNIVERSALE] FALLITO:", url);
      return null;
    }

    // ============================================================
    // CARICA LISTA JS (STATIC MAP)
    // ============================================================
    async function loadJSON() {
      const api = await fetchWithRetry("/api/js-list?v=" + VERSION);
      if (api) return api;

      const static1 = await fetchWithRetry("/data/js-list.json?v=" + VERSION);
      if (static1) return static1;

      const static2 = await fetchWithRetry("/data/js-list-mirror.json?v=" + VERSION);
      if (static2) return static2;

      console.warn("🟧 [UNIVERSALE] Nessuna lista JS disponibile");
      return { public: [], admin: [] };
    }

    // ============================================================
    // CARICA SCRIPT (SAFE, DEBUG)
    // ============================================================
    function loadScript(src) {
      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE LOAD-REQUEST]", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.defer = true;
        s.fetchPriority = "high";

        s.onload = () => {
          console.log("✅ [UNIVERSALE LOAD-OK]", src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE LOAD-FAIL]", src);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // IMPORT DEBUG
    // ============================================================
    async function debugImport(src) {
      try {
        await import(src + "?v=" + VERSION);
        console.log("📦 [UNIVERSALE IMPORT-OK]", src);
      } catch (e) {
        console.warn("📦❌ [UNIVERSALE IMPORT-FAIL]", src, e.message);
      }
    }

    // ============================================================
    // NOME BASE PAGINA
    // ============================================================
    function getPageBase() {
      const path = window.location.pathname;
      if (path === "/" || path === "") return "index";
      return path.split("/").pop().replace(".html", "");
    }

    // ============================================================
    // AVVIO (STATIC MAP MODE)
    // ============================================================
    async function run() {
      console.log("🟦 [UNIVERSALE 2030] critical-core-ready ricevuto → avvio run()");

      const list = await loadJSON();
      if (!list) {
        console.warn("🟧 [UNIVERSALE] Lista JS non disponibile");
        document.dispatchEvent(new Event("page-js-loaded"));
        return;
      }

      const base = getPageBase();
      const pool = list.public;

      const found = pool.filter(js => js.replace(".js", "") === base);

      if (found.length === 0) {
        console.warn("[UNIVERSALE 2030] Nessun JS public per", base);
        document.dispatchEvent(new Event("page-js-loaded"));
        return;
      }

      console.log("[UNIVERSALE 2030] Carico JS pagina:", found);

      for (const js of found) {
        const full = "/" + js;
        await loadScript(full);
        await debugImport(full);
      }

      console.log("🟩 [UNIVERSALE 2030] page-js-loaded");
      document.dispatchEvent(new Event("page-js-loaded"));
    }

    document.addEventListener("critical-core-ready", run);

  })();
}
