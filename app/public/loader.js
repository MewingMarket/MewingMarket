// ===============================
// CRITICAL LOADER — MewingMarket
// Versione 2027.600 — PATCH DEFINITIVA
// Garantisce SEMPRE:
// - api.js PRIMA di tutto
// - auth.js PRIMA di tutto
// - head / header / footer caricati
// - header.js caricato
// - carrello caricato
// - admin loader caricato
// - critical-ready emesso SOLO quando tutto è pronto
// ===============================

(function () {

  const VERSION = "20260412";

  // ============================================================
  // 0) CARICAMENTO API.JS — OBBLIGATORIO E BLOCCANTE
  // ============================================================
  const apiPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = `/api.js?v=${VERSION}`;
    s.onload = () => {
      console.log("[CRITICAL] api.js caricato");
      resolve();
    };
    s.onerror = () => {
      console.error("[CRITICAL] ERRORE: api.js non caricato");
      resolve(); // comunque risolvo per evitare deadlock
    };
    document.head.appendChild(s);
  });

  // ============================================================
  // 1) CARICAMENTO AUTH — DOPO API
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
  // 2) HEAD (SAFE FETCH)
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
  // 3) HEADER (SAFE FETCH)
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
  // 4) HEADER.JS
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
  // 5) FOOTER (SAFE FETCH)
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
  // 6) CARRELLO
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
  // 7) ADMIN LOADER
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
  // 8) CRITICAL READY — SOLO QUANDO TUTTO È PRONTO
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
    console.log("[CRITICAL] critical-ready emesso (2027.600)");
  });

})();
