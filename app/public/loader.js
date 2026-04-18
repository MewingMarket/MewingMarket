// ===============================
// CRITICAL LOADER — MewingMarket
// Garantisce SEMPRE:
// - api.js
// - head
// - header
// - footer
// - CSS
// - auth
// - routing base
// - carrello
// - admin loader
// - tracking / seo / structured-data
// ===============================

(function () {

  const VERSION = "20260412";

  // -------------------------------
  // 1) Utility scripts CRITICAL
  // -------------------------------
  function loadUtilityScript(name) {
    try {
      const id = `util-${name}`;
      if (document.getElementById(id)) return;

      const s = document.createElement("script");
      s.id = id;
      s.src = `/${name}.js?v=${VERSION}`;
      s.onload = () => console.log(`[CRITICAL] ${name}.js caricato`);
      s.onerror = () => console.warn(`[CRITICAL] ${name}.js non trovato`);
      document.head.appendChild(s);

    } catch (e) {
      console.warn(`[CRITICAL] Errore caricamento ${name}.js`, e);
    }
  }

  // ⚠️ Ordine: prima api, poi il resto
  loadUtilityScript("api");
  loadUtilityScript("seo");
  loadUtilityScript("structured-data");
  loadUtilityScript("tracking");

  // -------------------------------
  // 2) Routing CRITICAL
  // -------------------------------
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

  // -------------------------------
  // 3) AUTH CRITICAL
  // -------------------------------
  const authPromise = new Promise((resolve) => {
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

  // -------------------------------
  // 4) Logout automatico CRITICAL
  // -------------------------------
  let autoLogoutTriggered = false;

  document.addEventListener("auto-logout", () => {
    autoLogoutTriggered = true;
    const ph = document.getElementById("header-placeholder");
    if (ph) ph.innerHTML = "";
    document.dispatchEvent(new Event("header-reset"));
  });

  // -------------------------------
  // 5) HEAD CRITICAL (solo fetch)
  // -------------------------------
  function safeFetchAppendHead(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        [...temp.children].forEach((node) => document.head.appendChild(node));
        document.dispatchEvent(new Event("head-loaded"));
      })
      .catch(err => console.error("[CRITICAL] Errore HEAD:", url, err));
  }

  const headPromise = authPromise.then(() =>
    safeFetchAppendHead(`head.html?v=${VERSION}`)
      .catch(() => safeFetchAppendHead(`/head.html?v=${VERSION}`))
  );

  // -------------------------------
  // 6) HEADER CRITICAL (solo fetch)
  // -------------------------------
  function safeFetchHeader(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const ph = document.getElementById("header-placeholder");
        if (ph) ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
      })
      .catch(err => console.error("[CRITICAL] Errore HEADER:", url, err));
  }

  const headerPromise = headPromise.then(() =>
    safeFetchHeader(`header.html?v=${VERSION}`)
      .catch(() => safeFetchHeader(`/header.html?v=${VERSION}`))
  );

  // header.js
  const headerLogicPromise = headerPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = `header.js?v=${VERSION}`;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  });

  // -------------------------------
  // 7) FOOTER CRITICAL (solo fetch)
  // -------------------------------
  function safeFetchFooter(url) {
    return fetch(url)
      .then(r => r.text())
      .then(html => {
        const ph = document.getElementById("footer-placeholder");
        if (ph) ph.innerHTML = html;
        const year = document.getElementById("anno");
        if (year) year.textContent = new Date().getFullYear();
        document.dispatchEvent(new Event("footer-loaded"));
      })
      .catch(err => console.error("[CRITICAL] Errore FOOTER:", url, err));
  }

  safeFetchFooter(`footer.html?v=${VERSION}`)
    .catch(() => safeFetchFooter(`/footer.html?v=${VERSION}`));

  // -------------------------------
  // 8) CARRELLO CRITICAL
  // -------------------------------
  headerLogicPromise.then(() => {
    const s = document.createElement("script");
    s.src = `carrello.js?v=${VERSION}`;
    s.onload = () => console.log("[CRITICAL] carrello.js caricato");
    s.onerror = () => console.error("[CRITICAL] carrello.js non caricato");
    document.body.appendChild(s);
  });

  // -------------------------------
  // 9) ADMIN LOADER CRITICAL
  // -------------------------------
  document.addEventListener("auth-ready", () => {
    if (autoLogoutTriggered) return;

    headerLogicPromise.then(() => {
      if (window.isAdmin === true) {
        const s = document.createElement("script");
        s.src = `/admin/loader-admin.js?v=${VERSION}`;
        document.body.appendChild(s);
      }
    });
  });

  // -------------------------------------------------------
  // 10) CRITICAL READY EVENT (FRONTEND)
  // -------------------------------------------------------
  try {
    window.__criticalReady = true;
    document.dispatchEvent(new Event("critical-ready"));
    console.log("[CRITICAL] critical-ready emesso");
  } catch (e) {
    console.error("[CRITICAL] Errore emissione critical-ready:", e);
  }

})();
