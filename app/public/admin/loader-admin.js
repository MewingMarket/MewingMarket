// =========================================================
// ADMIN CRITICAL LOADER — Versione 2028.A HYBRID (ULTRA FAST SAFE)
// PATCH SUPREMA: niente critical-ready, solo critical-core-ready
// =========================================================

if (window.__ADMIN_CRITICAL_LOADER_2028A__) {
  console.warn("admin-critical-loader-2028A.js già caricato, skip.");
} else {
  window.__ADMIN_CRITICAL_LOADER_2028A__ = true;

  console.log("[ADMIN] Loader 2028.A HYBRID (ULTRA FAST SAFE) — PATCH SUPREMA");

  const ADMIN_VERSION = "20280412";

  /* =========================================================
     PRELOAD AGGRESSIVO (SAFE)
  ========================================================= */
  [
    "/admin/seo-admin.js",
    "/admin/structured-data-admin.js",
    "/admin/head-admin.html",
    "/admin/header-admin.html",
    "/admin/footer-admin.html"
  ].forEach(src => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = src.endsWith(".html") ? "fetch" : "script";
    link.href = `${src}?v=${ADMIN_VERSION}`;
    link.fetchPriority = "high";
    document.head.appendChild(link);
  });

  /* =========================================================
     UTILITY BASE
  ========================================================= */
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function loadScriptSerial(src) {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `${src}?v=${ADMIN_VERSION}`;
      s.async = true;
      s.fetchPriority = "high";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async function fetchHTMLWithRetry(urls, placeholderId, eventName, label, maxAttempts = 4) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const html = await r.text();

          const ph = document.getElementById(placeholderId);
          if (ph) ph.innerHTML = html;

          if (eventName) document.dispatchEvent(new Event(eventName));
          console.log(`[ADMIN] ${label} OK da ${url} (tentativo ${attempt})`);
          return true;

        } catch (e) {
          console.warn(`[ADMIN] ${label} FAIL da ${url} (tentativo ${attempt})`, e.message);
        }
      }
      await wait(200 * attempt);
    }
    console.error(`[ADMIN] ${label} FALLITO dopo ${maxAttempts} tentativi`);
    return false;
  }

  /* =========================================================
     /api/ping — ANTI‑502 (HYBRID)
  ========================================================= */
  async function waitUntilServerReady() {
    for (let i = 0; i < 10; i++) {
      try {
        const r = await fetch("/api/ping", { cache: "no-store" });
        if (r.ok) {
          console.log("[ADMIN] /api/ping OK");
          return true;
        }
      } catch {}
      await wait(120);
    }
    console.warn("[ADMIN] /api/ping non risponde — SAFE FALLBACK");
    return false;
  }

  /* =========================================================
     LOADER PRINCIPALE (HYBRID)
  ========================================================= */
  async function startAdminLoader() {

    console.log("[ADMIN] Avvio sequenza HYBRID 2028.A");

    let ok = true;

    await waitUntilServerReady();

    ok &= await loadScriptSerial(`/admin/seo-admin.js`);
    ok &= await loadScriptSerial(`/admin/structured-data-admin.js`);

    ok &= await fetchHTMLWithRetry(
      [`/admin/head-admin.html?v=${ADMIN_VERSION}`, `admin/head-admin.html?v=${ADMIN_VERSION}`],
      "head-admin-placeholder",
      "admin-head-loaded",
      "head-admin.html"
    );

    ok &= await fetchHTMLWithRetry(
      [`/admin/header-admin.html?v=${ADMIN_VERSION}`, `admin/header-admin.html?v=${ADMIN_VERSION}`],
      "header-admin-placeholder",
      "admin-header-loaded",
      "header-admin.html"
    );

    ok &= await fetchHTMLWithRetry(
      [`/admin/footer-admin.html?v=${ADMIN_VERSION}`, `admin/footer-admin.html?v=${ADMIN_VERSION}`],
      "footer-admin-placeholder",
      "admin-footer-loaded",
      "footer-admin.html"
    );

    /* =========================================================
       PATCH SUPREMA:
       NON emettiamo critical-ready.
       Emettiamo solo critical-core-ready.
    ========================================================= */
    console.log(ok
      ? "🟩 [ADMIN] critical-core-ready (FULL OK)"
      : "🟧 [ADMIN] critical-core-ready (DEGRADED)"
    );

    window.__criticalCoreReady = true;
    document.dispatchEvent(new Event("critical-core-ready"));
  }

  /* =========================================================
     AUTH CHECK & BOOTSTRAP (SAFE)
  ========================================================= */
  (function () {

    if (window.isAdmin) {
      startAdminLoader();
      return;
    }

    const s = document.createElement("script");
    s.src = `/auth.js?v=${ADMIN_VERSION}`;
    s.async = true;

    s.onload = () => {
      if (window.isAdmin) startAdminLoader();
      else console.warn("🟥 [ADMIN] Accesso negato — isAdmin = false");
    };

    s.onerror = () => {
      console.warn("🟥 [ADMIN] auth.js non caricato — accesso negato");
    };

    document.head.appendChild(s);

  })();

}
