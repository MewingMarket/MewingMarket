// =========================================================
// LOADER UNIVERSALE 2038 — ULTRA FAST SAFE MODE
// Compatibile con router /api/js-list (DB → JSON → loader)
// =========================================================

if (window.__LOADER_UNIVERSALE_2038__) {
  console.warn("loader-universale-2038.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_2038__ = true;

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

    const GLOBAL_JS = [
      "seo.js",
      "structured-data.js",
      "tracking.js",
      "auth.js",
      "header.js",
      "carrello.js"
    ];

    const SPECIAL_EXCLUDE = [
      "chat.js",
      "premium.js"
    ];

    const ADMIN_CRITICAL_EXCLUDE = [
      "loader-admin.js",
      "dynamic-admin-loader.js",
      "seo-admin.js",
      "structured-data-admin.js"
    ];

    const UNIVERSAL_EXCLUDE = [
      "loader-universale-2030.js",
      "loader-universale-2038.js"
    ];

    const EXCLUDE = [
      ...GLOBAL_JS,
      ...SPECIAL_EXCLUDE,
      ...ADMIN_CRITICAL_EXCLUDE,
      ...UNIVERSAL_EXCLUDE
    ];

    // ============================================================
    // RETRY INTELLIGENTE — ULTRA FAST
    // ============================================================
    async function fetchWithRetry(url, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          console.log(`[2038] js-list OK da ${url} (tentativo ${attempt})`);
          return r.json();
        } catch (e) {
          console.warn(`[2038] js-list FAIL da ${url} (tentativo ${attempt})`, e.message);
          await new Promise(r => setTimeout(r, attempt * 150)); // backoff 150/300/450ms
        }
      }
      console.error("[2038] js-list FALLITO dopo 3 tentativi");
      return null;
    }

    // ============================================================
    // CARICA LISTA JS (API → JSON → MIRROR)
    // ============================================================
    async function loadJSON() {
      const api = await fetchWithRetry("/api/js-list?v=" + VERSION);
      if (api) return api;

      const static1 = await fetchWithRetry("/data/js-list.json?v=" + VERSION);
      if (static1) return static1;

      const static2 = await fetchWithRetry("/data/js-list-mirror.json?v=" + VERSION);
      if (static2) return static2;

      console.error("[2038] IMPOSSIBILE CARICARE js-list");
      return { public: [], admin: [] };
    }

    // ============================================================
    // CARICA SCRIPT (SAFE)
    // ============================================================
    function loadScript(src) {
      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = true;               // ⚡ più veloce di defer
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
      if (path === "/" || path === "") return "index";
      let base = path.split("/").pop();
      return base.replace(".html", "");
    }

    // ============================================================
    // AVVIO
    // ============================================================
    async function run() {
      const list = await loadJSON();
      if (!list) {
        console.error("[2038] js-list non disponibile, skip.");
        return;
      }

      const base = getPageBase();
      const isAdmin = window.location.pathname.startsWith("/admin");

      const pool = isAdmin ? list.admin : list.public;

      const candidates = [
        `${base}.js`,
        `${base}-page.js`,
        `${base}-controller.js`
      ];

      const found = candidates.filter(js =>
        pool.includes(js) &&
        !EXCLUDE.includes(js)
      );

      if (found.length === 0) {
        console.warn("[UNIVERSALE 2038] Nessun JS per", base);
        return;
      }

      console.log("[UNIVERSALE 2038] Carico:", found);

      for (const js of found) {
        await loadScript("/" + (isAdmin ? "admin/" : "") + js);
      }
    }

    document.addEventListener("critical-ready", run);

  })();
}
