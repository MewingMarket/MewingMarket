// =========================================================
// CRITICAL LOADER — MewingMarket
// Versione 2027.970 — SENZA mm-api.js (Java-mode)
// Compatibile universal-json + router universale
// =========================================================

(function () {

  const VERSION = "20270412";

  console.log("[CRITICAL] Loader avviato (Java-mode, no mm-api.js)");

  /* ============================================================
     1) Caricamento utility (SEO, Structured Data, Tracking)
  ============================================================ */
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

  /* ============================================================
     2) INTROSPECT (frontend → backend)
  ============================================================ */
  const introspectPromise = new Promise(resolve => {
    const s = document.createElement("script");
    s.src = `/introspect.js?v=${VERSION}`;
    s.onload = () => {
      console.log("[CRITICAL] introspect.js caricato");
      resolve();
    };
    s.onerror = () => {
      console.warn("[CRITICAL] introspect.js non trovato");
      resolve();
    };
    document.head.appendChild(s);
  });

  /* ============================================================
     3) DIAGNOSTICA FETCH (solo /api/, compatibile universal-json)
  ============================================================ */
  const diagnosticaPromise = new Promise(resolve => {
    const s = document.createElement("script");
    s.src = `/js/diagnostica-loader.js?v=${VERSION}`;
    s.onload = () => {
      console.log("[CRITICAL] diagnostica-loader.js caricato");
      resolve();
    };
    s.onerror = () => {
      console.warn("[CRITICAL] diagnostica-loader.js non trovato");
      resolve();
    };
    document.head.appendChild(s);
  });

  /* ============================================================
     4) AUTH (caricata sempre, no mm-api)
  ============================================================ */
  const authPromise = new Promise(resolve => {
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

  /* ============================================================
     5) HEAD HTML (compatibile universal-json)
  ============================================================ */
  function safeFetchAppendHead(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        if (!html || html.trim().startsWith("<!DOCTYPE html") && !html.includes("<head"))
          console.warn("[CRITICAL] head.html sembra HTML fallback");

        const temp = document.createElement("div");
        temp.innerHTML = html;

        [...temp.children].forEach(node => {
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

  /* ============================================================
     6) HEADER HTML
  ============================================================ */
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

  /* ============================================================
     7) HEADER LOGIC (header.js)
  ============================================================ */
  const headerLogicPromise = headerPromise.then(() => {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `/header.js?v=${VERSION}`;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  });

  /* ============================================================
     8) FOOTER HTML
  ============================================================ */
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

  /* ============================================================
     9) CARRELLO
  ============================================================ */
  const carrelloPromise = headerLogicPromise.then(() => {
    return new Promise(resolve => {
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

  /* ============================================================
     10) ADMIN LOADER (solo se admin)
  ============================================================ */
  const adminPromise = authPromise.then(() => {
    return new Promise(resolve => {
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
        setTimeout(resolve, 2000);
      }
    });
  });

  /* ============================================================
     11) CRITICAL READY
  ============================================================ */
  Promise.all([
    introspectPromise,
    diagnosticaPromise,
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
    console.log("[CRITICAL] critical-ready emesso (2027.970)");
  });

})();
