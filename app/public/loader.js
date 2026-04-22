// ===============================
// CRITICAL LOADER — MewingMarket
// Versione 2027.700 — COMPLETA + PATCH DEFINITIVA
// ===============================

(function () {

  const VERSION = "20260412";

  // ============================================================
  // 0) CARICAMENTO mm-api.js — ORA GESTITO DAL DOM
  //    Qui ci limitiamo solo a verificare che esista
  // ============================================================
  const apiPromise = new Promise((resolve) => {
    if (window.fetchUniversale && window.apiFetch && window.fetchCritico && window.fetchSafe) {
      console.log("[CRITICAL] mm-api.js già caricato dal DOM");
      resolve();
      return;
    }

    // Fallback di sicurezza: se per qualche motivo non è nel DOM,
    // proviamo comunque a caricarlo una sola volta.
    const s = document.createElement("script");
    s.src = `/mm-api.js?v=${VERSION}`;
    s.onload = () => {
      console.log("[CRITICAL] mm-api.js caricato via loader (fallback)");
      resolve();
    };
    s.onerror = () => {
      console.error("[CRITICAL] ERRORE: mm-api.js non caricato");
      resolve();
    };
    document.head.appendChild(s);
  });

  // ============================================================
  // 1) SEO / STRUCTURED-DATA / TRACKING
  // ============================================================
  function loadUtility(name) {
    const s = document.createElement("script");
    s.src = `/${name}.js?v=${VERSION}`;
    s.onload = () => console.log(`[CRITICAL] ${name}.js caricato`);
    s.onerror = () => console.warn(`[CRITICAL] ${name}.js non trovato`);
    document.head.appendChild(s);
  }

  loadUtility("seo");
  loadUtility("structured-data");
  loadUtility("tracking");

  // ============================================================
  // 2) ROUTING CRITICO (TUO CODICE ORIGINALE)
  // ============================================================
  function normalize(str) {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  const rawPath = location.pathname || "/";
  const pathLower = rawPath.toLowerCase();
  const segments = pathLower.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  let pageName = "";
  if (pathLower.endsWith(".html")) {
    pageName = normalize(pathLower.split("/").pop());
  } else {
    pageName = normalize(firstSegment);
  }

  const isHome =
    pathLower === "/" ||
    pathLower === "/index" ||
    pathLower.endsWith("/index.html");

  const isAdminPage =
    pathLower.includes("/admin/") || firstSegment === "admin";

  const isShopPage = (() => {
    if (isHome) return true;
    const shopRoots = ["catalogo", "prodotto", "checkout", "categories", "shop"];
    return shopRoots.some((root) => pageName.startsWith(root));
  })();

  const isUserPage = (() => {
    const userRoots = [
      "dashboard", "ordini", "download", "resetpassword",
      "resetemail", "reset", "eliminaaccount",
      "thankyou", "cancel", "disiscriviti", "iscrizione"
    ];
    return userRoots.some((root) => pageName.startsWith(root));
  })();

  console.log("[CRITICAL] Routing:", { isHome, isShopPage, isAdminPage, isUserPage });

  // ============================================================
  // 3) AUTH — DOPO API
  // ============================================================
  const authPromise = apiPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `/auth.js?v=${VERSION}`;
      s.onload = () => {
        console.log("[CRITICAL] auth.js caricato");
        resolve();
      };
      s.onerror = () => {
        console.error("[CRITICAL] ERRORE: auth.js non caricato");
        resolve();
      };
      document.head.appendChild(s);
    });
  });

  // ============================================================
  // 4) HEAD
  // ============================================================
  function safeFetchAppendHead(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        [...temp.children].forEach((node) => document.head.appendChild(node));
        document.dispatchEvent(new Event("head-loaded"));
      });
  }

  const headPromise = authPromise.then(() =>
    safeFetchAppendHead(`head.html?v=${VERSION}`)
      .catch(() => safeFetchAppendHead(`/head.html?v=${VERSION}`))
  );

  // ============================================================
  // 5) HEADER
  // ============================================================
  function safeFetchHeader(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const ph = document.getElementById("header-placeholder");
        if (ph) ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
      });
  }

  const headerPromise = headPromise.then(() =>
    safeFetchHeader(`header.html?v=${VERSION}`)
      .catch(() => safeFetchHeader(`/header.html?v=${VERSION}`))
  );

  // ============================================================
  // 6) HEADER.JS
  // ============================================================
  const headerLogicPromise = headerPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `header.js?v=${VERSION}`;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  });

  // ============================================================
  // 7) FOOTER
  // ============================================================
  function safeFetchFooter(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const ph = document.getElementById("footer-placeholder");
        if (ph) ph.innerHTML = html;
        const year = document.getElementById("anno");
        if (year) year.textContent = new Date().getFullYear();
        document.dispatchEvent(new Event("footer-loaded"));
      });
  }

  const footerPromise = safeFetchFooter(`footer.html?v=${VERSION}`)
    .catch(() => safeFetchFooter(`/footer.html?v=${VERSION}`));

  // ============================================================
  // 8) CARRELLO
  // ============================================================
  const carrelloPromise = headerLogicPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `carrello.js?v=${VERSION}`;
      s.onload = () => {
        console.log("[CRITICAL] carrello.js caricato");
        resolve();
      };
      s.onerror = () => {
        console.error("[CRITICAL] carrello.js non caricato");
        resolve();
      };
      document.body.appendChild(s);
    });
  });

  // ============================================================
  // 9) ADMIN LOADER
  // ============================================================
  const adminPromise = authPromise.then(() => {
    return new Promise((resolve) => {
      document.addEventListener("auth-ready", () => {
        if (window.isAdmin === true) {
          const s = document.createElement("script");
          s.src = `/admin/loader-admin.js?v=${VERSION}`;
          s.onload = resolve;
          s.onerror = resolve;
          document.body.appendChild(s);
        } else {
          resolve();
        }
      });
    });
  });

  // ============================================================
  // 10) CRITICAL READY
  // ============================================================
  Promise.all([
    apiPromise,
    authPromise,
    headPromise,
    headerPromise,
    headerLogicPromise,
    footerPromise,
    carrelloPromise,
    adminPromise
  ]).then(() => {
    window.__criticalReady = true;
    document.dispatchEvent(new Event("critical-ready"));
    console.log("[CRITICAL] critical-ready emesso (2027.700)");
  });

})();
