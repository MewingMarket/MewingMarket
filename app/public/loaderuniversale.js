// =========================================================
// LOADER UNIVERSALE PUBLIC — STATIC MAP MODE (ULTRA SAFE)
// Percorso reale: /app/public/loaderuniversale.js
// =========================================================

if (window.__LOADER_UNIVERSALE_PUBLIC__) {
  console.warn("loaderuniversale.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_PUBLIC__ = true;

  (function () {

    const VERSION = "2050"; // versione pipeline

    console.log("⚡ [UNIVERSALE PUBLIC] Avvio loader universale PUBLIC (STATIC MAP)");

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
      console.log("🟦 [UNIVERSALE PUBLIC] critical-core-ready ricevuto → avvio run()");

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
        console.warn("[UNIVERSALE PUBLIC] Nessun JS public per", base);
        document.dispatchEvent(new Event("page-js-loaded"));
        return;
      }

      console.log("[UNIVERSALE PUBLIC] Carico JS pagina:", found);

      for (const js of found) {
        const full = "/" + js;
        await loadScript(full);
        await debugImport(full);
      }

      console.log("🟩 [UNIVERSALE PUBLIC] page-js-loaded");
      document.dispatchEvent(new Event("page-js-loaded"));
    }

    document.addEventListener("critical-core-ready", run);

  })();
}
/* =========================================================
 * DEBUG UNIVERSALE 2050 — LOG JS TEORICO + MOTIVO DEL FAIL
 * ========================================================= */

(function () {

  function getPageBase() {
    const p = window.location.pathname;
    if (p === "/" || p === "") return "index";
    return p.split("/").pop().replace(".html", "");
  }

  async function testJS(pageBase) {
    const jsName = pageBase + ".js";
    const full = "/" + jsName;

    console.log("🔍 [DEBUG-UNIVERSALE] JS teorico della pagina:", jsName);

    // 1) HEAD → MIME TYPE
    try {
      const head = await fetch(full, { method: "HEAD" });
      const mime = head.headers.get("content-type");
      console.log("📌 [DEBUG-UNIVERSALE] MIME:", mime);

      if (!mime || !mime.includes("javascript")) {
        console.warn("🟥 [DEBUG-UNIVERSALE] MIME NON VALIDO → il browser NON esegue il file");
      }
    } catch (e) {
      console.warn("🟥 [DEBUG-UNIVERSALE] HEAD fallito:", e.message);
    }

    // 2) GET → esiste?
    let code = null;
    try {
      const r = await fetch(full);
      if (!r.ok) {
        console.warn("🟥 [DEBUG-UNIVERSALE] GET fallito → HTTP", r.status);
        return;
      }
      code = await r.text();
      console.log("📦 [DEBUG-UNIVERSALE] File scaricato, lunghezza:", code.length);
    } catch (e) {
      console.warn("🟥 [DEBUG-UNIVERSALE] GET errore:", e.message);
      return;
    }

    // 3) Sintassi JS
    try {
      new Function(code);
      console.log("⚡ [DEBUG-UNIVERSALE] Sintassi OK");
    } catch (e) {
      console.warn("🟥 [DEBUG-UNIVERSALE] ERRORE DI SINTASSI:", e.message);
      return;
    }

    // 4) Esecuzione isolata
    try {
      await import(full + "?debug=" + Date.now());
      console.log("🟩 [DEBUG-UNIVERSALE] Esecuzione OK");
    } catch (e) {
      console.warn("🟥 [DEBUG-UNIVERSALE] ERRORE IN ESECUZIONE:", e.message);
    }
  }

  // Trigger automatico al cambio pagina
  document.addEventListener("DOMContentLoaded", () => {
    const base = getPageBase();
    console.log("🟦 [DEBUG-UNIVERSALE] Pagina:", base);
    testJS(base);
  });

})();
