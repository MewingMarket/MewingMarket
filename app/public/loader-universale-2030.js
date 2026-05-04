// =========================================================
// LOADER UNIVERSALE 2038 — MewingMarket
// Legge js-list.json + mirror, carica solo JS pagina
// Esclude globali + speciali
// =========================================================

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

  async function loadJSON() {
    try {
      const r = await fetch("/js-list.json?v=" + VERSION);
      if (r.ok) return r.json();
    } catch {}

    const r2 = await fetch("/js-list-mirror.json?v=" + VERSION);
    return r2.json();
  }

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

  function getPageBase() {
    const path = window.location.pathname;

    // Homepage
    if (path === "/" || path === "") return "index";

    let base = path.split("/").pop();
    return base.replace(".html", "");
  }

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
      !GLOBAL_JS.includes(js) &&
      !SPECIAL_EXCLUDE.includes(js)
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
