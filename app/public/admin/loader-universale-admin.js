// =========================================================
// LOADER UNIVERSALE ADMIN 2038 — STATIC MAP MODE (ULTRA FAST SAFE)
// Usa solo la lista admin da /api/js-list
// =========================================================

if (window.__LOADER_UNIVERSALE_ADMIN_2038__) {
  console.warn("loader-universale-admin-2038.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_ADMIN_2038__ = true;

  (function () {

    const VERSION = "2038";

    // ============================================================
    // PRELOAD AGGRESSIVO (SAFE)
    // ============================================================
    [
      "/api/js-list",
      "/data/js-list.json",
      "/data/js-list-mirror.json"
    ].forEach(src => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "fetch";
      link.href = `${src}?v=${VERSION}`;
      link.fetchPriority = "high";
      document.head.appendChild(link);
    });

    // ============================================================
    // RETRY INTELLIGENTE — ULTRA FAST
    // ============================================================
    async function fetchWithRetry(url, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        } catch (e) {
          await new Promise(r => setTimeout(r, attempt * 150));
        }
      }
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

      return { public: [], admin: [] };
    }

    // ============================================================
    // CARICA SCRIPT (SAFE)
    // ============================================================
    function loadScript(src) {
      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = true;
        s.fetchPriority = "high";
        s.onload = resolve;
        s.onerror = resolve;
        document.body.appendChild(s);
      });
    }

    // ============================================================
    // NOME BASE PAGINA
    // ============================================================
    function getPageBase() {
      const path = window.location.pathname;
      let base = path.split("/").pop();
      return base.replace(".html", "");
    }

    // ============================================================
    // AVVIO (STATIC MAP MODE)
    // ============================================================
    async function run() {
      const list = await loadJSON();
      if (!list) return;

      const base = getPageBase();

      // SOLO LISTA ADMIN
      const pool = list.admin;

      // STATIC MAP → nessuna detection
      const found = pool.filter(js => js.replace(".js", "") === base);

      if (found.length === 0) {
        console.warn("[UNIVERSALE ADMIN 2038] Nessun JS admin per", base);
        document.dispatchEvent(new Event("page-js-loaded"));
        return;
      }

      console.log("[UNIVERSALE ADMIN 2038] Carico:", found);

      for (const js of found) {
        await loadScript("/admin/" + js);
      }

      // Segnale al loader supremo admin
      document.dispatchEvent(new Event("page-js-loaded"));
    }

    document.addEventListener("critical-core-ready", run);

  })();
}
