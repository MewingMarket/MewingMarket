// =========================================================
// LOADER UNIVERSALE 2038 — MewingMarket
// Compatibile con router /api/js-list (DB → JSON → loader)
// =========================================================

// Protezione anti-doppio-caricamento
(function(name){
  window.__LOADER_GUARD__ = window.__LOADER_GUARD__ || {};
  if (window.__LOADER_GUARD__[name]) {
    console.warn(name + " già caricato, skip.");
    return;
  }
  window.__LOADER_GUARD__[name] = true;
})("loader-universale-2038.js");

(function () {

  const VERSION = "2038";

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
  // CARICA LISTA JS (API → JSON → MIRROR)
  // ============================================================
  async function loadJSON() {
    try {
      const r = await fetch("/api/js-list?v=" + VERSION, { cache: "no-store" });
      if (r.ok) return r.json();
    } catch {}

    try {
      const r2 = await fetch("/data/js-list.json?v=" + VERSION, { cache: "no-store" });
      if (r2.ok) return r2.json();
    } catch {}

    const r3 = await fetch("/data/js-list-mirror.json?v=" + VERSION, { cache: "no-store" });
    return r3.json();
  }

  // ============================================================
  // CARICA SCRIPT
  // ============================================================
  function loadScript(src) {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
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
