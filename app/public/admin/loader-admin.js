// =========================================================
// ADMIN CRITICAL LOADER — Versione 2050 (ULTRA MINIMAL SAFE)
// Carica SOLO head/header/footer + header-admin.js
// Emette SEMPRE critical-core-ready
// =========================================================

if (window.__ADMIN_CRITICAL_LOADER_2050__) {
  console.warn("admin-critical-loader-2050.js già caricato, skip.");
} else {
  window.__ADMIN_CRITICAL_LOADER_2050__ = true;

  console.log("[ADMIN] Loader 2050 — ULTRA MINIMAL SAFE MODE");

  const ADMIN_VERSION = "2050";

  /* =========================================================
     PRELOAD (solo HTML + header-admin.js)
  ========================================================= */
  [
    "/admin/head-admin.html",
    "/admin/header-admin.html",
    "/admin/footer-admin.html",
    "/admin/header-admin.js"
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
      console.log("➡️ [CRITICAL-LOAD-REQUEST]", src);

      const s = document.createElement("script");
      s.src = `${src}?v=${ADMIN_VERSION}`;
      s.async = false;                 // ← PATCH FONDAMENTALE
      s.fetchPriority = "high";

      s.onload = () => {
        console.log("✅ [CRITICAL-LOAD-OK]", src);
        resolve(true);
      };

      s.onerror = () => {
        console.warn("❌ [CRITICAL-LOAD-FAIL]", src);
        resolve(false);
      };

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
     /api/ping — ANTI‑502
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
     LOADER PRINCIPALE (ULTRA MINIMAL)
  ========================================================= */
  async function startAdminLoader() {

    console.log("[ADMIN] Avvio sequenza CRITICAL 2050");

    await waitUntilServerReady();

    // 1) HEAD
    await fetchHTMLWithRetry(
      [`/admin/head-admin.html?v=${ADMIN_VERSION}`],
      "head-admin-placeholder",
      "admin-head-loaded",
      "head-admin.html"
    );

    // 2) HEADER
    await fetchHTMLWithRetry(
      [`/admin/header-admin.html?v=${ADMIN_VERSION}`],
      "header-admin-placeholder",
      "admin-header-loaded",
      "header-admin.html"
    );

    // 3) FOOTER
    await fetchHTMLWithRetry(
      [`/admin/footer-admin.html?v=${ADMIN_VERSION}`],
      "footer-admin-placeholder",
      "admin-footer-loaded",
      "footer-admin.html"
    );

    // 4) HEADER-ADMIN.JS
    await loadScriptSerial("/admin/header-admin.js");

    // 5) IMPORT DEBUG
    try {
      await import("/admin/header-admin.js?v=" + ADMIN_VERSION);
      console.log("📦 [IMPORT-OK] /admin/header-admin.js");
    } catch (e) {
      console.warn("📦❌ [IMPORT-FAIL] /admin/header-admin.js", e.message);
    }

    /* =========================================================
       CRITICAL-CORE-READY SEMPRE EMESSO
    ========================================================= */
    console.log("🟩 [ADMIN] critical-core-ready (MINIMAL MODE)");
    window.__criticalCoreReady = true;
    document.dispatchEvent(new Event("critical-core-ready"));
  }

  /* =========================================================
     AUTH CHECK (SOLO PER PERMETTERE L'ACCESSO)
     MA NON CARICA PIÙ auth.js QUI
  ========================================================= */
  (function () {

    if (window.isAdmin) {
      startAdminLoader();
      return;
    }

    // Carichiamo auth.js SOLO per verificare accesso,
    // ma NON fa parte del critical loader.
    const s = document.createElement("script");
    s.src = `/auth.js?v=${ADMIN_VERSION}`;
    s.async = false;                 // ← PATCH FONDAMENTALE

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
