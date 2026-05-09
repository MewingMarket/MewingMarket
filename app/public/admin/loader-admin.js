// =========================================================
// ADMIN CRITICAL LOADER — Versione 2028.A ULTRA FAST (SAFE)
// =========================================================

if (window.__ADMIN_CRITICAL_LOADER_2028A__) {
  console.warn("admin-critical-loader-2028A.js già caricato, skip.");
} else {
  window.__ADMIN_CRITICAL_LOADER_2028A__ = true;

  console.log("[ADMIN] Loader 2028.A ULTRA FAST (SAFE)");

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
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function loadScriptSerial(src) {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `${src}?v=${ADMIN_VERSION}`;
      s.async = true;                 // ⚡ più veloce di defer
      s.fetchPriority = "high";       // ⚡ priorità massima
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  function fetchHTMLSerial(url, placeholderId, eventName) {
    return fetch(url)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(html => {
        const ph = document.getElementById(placeholderId);
        if (ph) ph.innerHTML = html;
        if (eventName) document.dispatchEvent(new Event(eventName));
      })
      .catch(() => console.warn(`[ADMIN] ${url} non caricato`));
  }

  /* =========================================================
     /api/ping — ANTI‑502 (ULTRA FAST)
  ========================================================= */
  async function waitUntilServerReady() {
    for (let i = 0; i < 8; i++) {     // ⚡ meno tentativi, più rapidi
      try {
        const r = await fetch("/api/ping", { cache: "no-store" });
        if (r.ok) return;
      } catch {}
      await wait(100);               // ⚡ più veloce di 150ms
    }
    console.warn("[ADMIN] /api/ping non risponde — SAFE FALLBACK");
  }

  /* =========================================================
     LOADER PRINCIPALE (SERIALE, MA OTTIMIZZATO)
  ========================================================= */
  async function startAdminLoader() {

    console.log("[ADMIN] Avvio sequenza ULTRA FAST 2028.A");

    // 1) Aspetta che il server sia vivo
    await waitUntilServerReady();

    // 2) SEO + Structured Data (seriale ma async)
    await loadScriptSerial(`/admin/seo-admin.js`);
    await loadScriptSerial(`/admin/structured-data-admin.js`);

    // 3) HEAD ADMIN
    await fetchHTMLSerial(`/admin/head-admin.html?v=${ADMIN_VERSION}`,
                          "head-admin-placeholder",
                          "admin-head-loaded");

    // 4) HEADER ADMIN
    await fetchHTMLSerial(`/admin/header-admin.html?v=${ADMIN_VERSION}`,
                          "header-admin-placeholder",
                          "admin-header-loaded");

    // 5) FOOTER ADMIN
    await fetchHTMLSerial(`/admin/footer-admin.html?v=${ADMIN_VERSION}`,
                          "footer-admin-placeholder",
                          "admin-footer-loaded");

    // 6) CRITICAL READY
    window.__criticalReady = true;
    document.dispatchEvent(new Event("critical-ready"));
    console.log("[ADMIN] critical-ready (ULTRA FAST SAFE)");
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
    document.head.appendChild(s);

  })();

}
