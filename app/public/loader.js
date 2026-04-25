// ===============================
// CRITICAL LOADER — MewingMarket
// Versione 2027.701 — COMPLETA + PATCH DEFINITIVA
// ===============================

(function () {

  const VERSION = "20260412";

  // ============================================================
  // 0) CARICAMENTO mm-api.js — OBBLIGATORIO E BLOCCANTE
  // ============================================================
  const apiPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.id = "critical-api";
    s.src = `/mm-api.js?v=${VERSION}`;
    s.onload = () => {
      console.log("[CRITICAL] mm-api.js caricato");
      resolve();
    };
    s.onerror = () => {
      console.error("[CRITICAL] ERRORE: mm-api.js non caricato");
      resolve();
    };
    document.head.appendChild(s);
  });

  // ============================================================
  // 1) SEO / STRUCTURED-DATA / TRACKING (ASINCRONI)
  // ============================================================
  function loadUtility(name) {
    const s = document.createElement("script");
    s.src = `/${name}.js?v=${VERSION}`;
    s.async = true;
    s.onload = () => console.log(`[CRITICAL] ${name}.js caricato`);
    s.onerror = () => console.warn(`[CRITICAL] ${name}.js non trovato`);
    document.head.appendChild(s);
  }

  loadUtility("seo");
  loadUtility("structured-data");
  loadUtility("tracking");

  // ============================================================
  // 2) ROUTING CRITICO 
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

  let pageName = pathLower.endsWith(".html") ? normalize(pathLower.split("/").pop()) : normalize(firstSegment);

  const isHome = pathLower === "/" || pathLower === "/index" || pathLower.endsWith("/index.html");
  const isAdminPage = pathLower.includes("/admin/") || firstSegment === "admin";

  console.log("[CRITICAL] Routing:", { pageName, isHome, isAdminPage });

  // ============================================================
  // 3) AUTH — PARTE DOPO API
  // ============================================================
  const authPromise = apiPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.id = "critical-auth";
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
  // 4) HEAD (META, CSS DINAMICI)
  // ============================================================
  function safeFetchAppendHead(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        [...temp.children].forEach((node) => {
            if (node.tagName === "SCRIPT") {
                const s = document.createElement("script");
                s.text = node.text;
                document.head.appendChild(s);
            } else {
                document.head.appendChild(node);
            }
        });
        document.dispatchEvent(new Event("head-loaded"));
        return true;
      })
      .catch(err => {
        console.error("[CRITICAL] head non caricato:", err);
        throw err;
      });
  }

  const headPromise = authPromise.then(() =>
    safeFetchAppendHead(`head.html?v=${VERSION}`)
      .catch(() => safeFetchAppendHead(`/head.html?v=${VERSION}`))
  );

  // ============================================================
  // 5) HEADER HTML
  // ============================================================
  function safeFetchHeader(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const ph = document.getElementById("header-placeholder");
        if (ph) ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
        return true;
      })
      .catch(err => {
        console.error("[CRITICAL] header non caricato:", err);
        throw err;
      });
  }

  const headerPromise = headPromise.then(() =>
    safeFetchHeader(`header.html?v=${VERSION}`)
      .catch(() => safeFetchHeader(`/header.html?v=${VERSION}`))
  );

  // ============================================================
  // 6) HEADER.JS (LOGICA MENU/UI)
  // ============================================================
  const headerLogicPromise = headerPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `/header.js?v=${VERSION}`;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  });

  // ============================================================
  // 7) FOOTER — PATCH DEFINITIVA
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
        return true; 
      })
      .catch(err => {
        console.error("[CRITICAL] footer non caricato:", err);
        return true; 
      });
  }

  const footerPromise = safeFetchFooter(`footer.html?v=${VERSION}`)
    .catch(() => safeFetchFooter(`/footer.html?v=${VERSION}`));

  // ============================================================
  // 8) CARRELLO — CARICAMENTO AUTOMATICO GLOBALE
  // ============================================================
  const carrelloPromise = headerLogicPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.id = "critical-carrello";
      s.src = `/carrello.js?v=${VERSION}`;
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
  // 9) ADMIN LOADER (SOLO SE NECESSARIO)
  // ============================================================
  const adminPromise = authPromise.then(() => {
    return new Promise((resolve) => {
      const checkAdmin = () => {
        if (window.isAdmin === true) {
          const s = document.createElement("script");
          s.src = `/admin/loader-admin.js?v=${VERSION}`;
          s.onload = resolve;
          s.onerror = resolve;
          document.body.appendChild(s);
        } else {
          resolve();
        }
      };

      if (window.isAdmin !== undefined) {
          checkAdmin();
      } else {
          document.addEventListener("auth-ready", checkAdmin, { once: true });
          // Timeout di sicurezza per non bloccare il critical-ready
          setTimeout(resolve, 2000);
      }
    });
  });

  // ============================================================
  // 10) CRITICAL READY — EMISSIONE FINALE
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
    console.log("[CRITICAL] critical-ready emesso (2027.701)");
  });

})();
