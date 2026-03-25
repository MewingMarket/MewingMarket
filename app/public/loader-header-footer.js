// =========================================================
// LOADER HEADER/FOOTER — Versione DEFINITIVA (2026 + PATCH DEPLOY)
// Carica: auth.js → head → header.html → header.js → carrello.js → footer
// =========================================================

(function () {

  function normalize(str) {
    if (!str) return "";
    return str
      .toLowerCase()
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
    const lastPart = pathLower.split("/").pop();
    pageName = normalize(lastPart);
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
    const norm = pageName;
    if (!norm) return false;
    return shopRoots.some((root) => norm.startsWith(root));
  })();

  const isUserPage = (() => {
    const userRoots = [
      "dashboard",
      "ordini",
      "download",
      "resetpassword",
      "resetemail",
      "reset",
      "eliminaaccount",
      "thankyou",
      "cancel",
      "disiscriviti",
      "iscrizione"
    ];
    const norm = pageName;
    if (!norm) return false;
    return userRoots.some((root) => norm.startsWith(root));
  })();

  const isGlobalPage = !isAdminPage && !isShopPage && !isUserPage;

  console.log("[LOADER] Page:", { isHome, isShopPage, isAdminPage, isUserPage, isGlobalPage });

  // =========================================================
  // 0) AUTH — deve essere caricato PRIMA DI TUTTO
  // =========================================================
  const authPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "/auth.js"; // ⭐ FIX CRITICO
    s.onload = () => {
      console.log("[LOADER] auth.js caricato (PRIMA DI TUTTO)");
      resolve();
    };
    document.head.appendChild(s);
  });

  // =========================================================
  // PATCH — Logout automatico da deploy
  // =========================================================
  let autoLogoutTriggered = false;

  document.addEventListener("auto-logout", () => {
    console.log("[LOADER] Logout automatico rilevato → reset header");

    autoLogoutTriggered = true;

    const ph = document.getElementById("header-placeholder");
    if (ph) ph.innerHTML = "";

    document.dispatchEvent(new Event("header-reset"));
  });

  // =========================================================
  // 1) HEAD
  // =========================================================
  function safeFetchAppendHead(url) {
    return fetch(url)
      .then((r) => r.text())
      .then((html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        [...temp.children].forEach((node) => document.head.appendChild(node));
        document.dispatchEvent(new Event("head-loaded"));
      });
  }

  const headPromise = authPromise.then(() =>
    safeFetchAppendHead("head.html").catch(() =>
      safeFetchAppendHead("/head.html")
    )
  );

  // =========================================================
  // 2) HEADER (UNICO)
  // =========================================================
  let headerFile = null;

  if (!isAdminPage) {
    headerFile = "header.html";
  }

  function safeFetchHeader(url) {
    return fetch(url)
      .then((r) => r.text())
      .then((html) => {
        const ph = document.getElementById("header-placeholder");
        if (!ph) return;
        ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
      });
  }

  const headerPromise = headPromise.then(() =>
    headerFile
      ? safeFetchHeader(headerFile).catch(() =>
          safeFetchHeader("/" + headerFile)
        )
      : Promise.resolve()
  );

  // =========================================================
  // 3) HEADER.JS
  // =========================================================
  const headerLogicPromise = headerPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "header.js";
      s.onload = () => {
        console.log("[LOADER] header.js caricato");
        resolve();
      };
      document.body.appendChild(s);
    });
  });

  // =========================================================
  // 4) FOOTER
  // =========================================================
  function safeFetchFooter(url) {
    return fetch(url)
      .then((r) => r.text())
      .then((html) => {
        const ph = document.getElementById("footer-placeholder");
        if (!ph) return;
        ph.innerHTML = html;
        const year = document.getElementById("anno");
        if (year) year.textContent = new Date().getFullYear();
        document.dispatchEvent(new Event("footer-loaded"));
      });
  }

  safeFetchFooter("footer.html").catch(() =>
    safeFetchFooter("/footer.html")
  );

  // =========================================================
  // 5) CARRELLO
  // =========================================================
  const cartPromise = headerLogicPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "carrello.js";
      s.onload = () => {
        console.log("[LOADER] carrello.js caricato");
        resolve();
      };
      document.body.appendChild(s);
    });
  });

  // =========================================================
  // 6) ADMIN LOADER — PATCH FINALE
  // =========================================================
  document.addEventListener("auth-ready", () => {
    if (autoLogoutTriggered) {
      console.log("[LOADER] Admin loader BLOCCATO (logout automatico)");
      return;
    }

    // Carica admin SOLO dopo che header.js ha finito
    headerLogicPromise.then(() => {
      if (autoLogoutTriggered) {
        console.log("[LOADER] Admin loader BLOCCATO (logout automatico, post-header)");
        return;
      }

      // ⭐ CONTROLLO FINALE — evita rilog automatico anche se RAM era sporca
      if (window.isAdmin === true && autoLogoutTriggered === false) {
        console.log("[LOADER] Carico admin (utente admin reale, stato verificato post-header)");
        const s = document.createElement("script");
        s.src = "/admin/loader-admin.js";
        document.body.appendChild(s);
      } else {
        console.log("[LOADER] Admin NON caricato (stato finale non admin)");
      }
    });
  });

})();
