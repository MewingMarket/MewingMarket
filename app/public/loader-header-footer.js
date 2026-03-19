// =========================================================
// LOADER HEADER/FOOTER — Versione DEFINITIVA (2026)
// Carica: head → header.html → auth.js → header.js → carrello.js → footer
// =========================================================

(function () {

  // ------------------------
  // Utility
  // ------------------------
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

  safeFetchAppendHead("head.html").catch(() =>
    safeFetchAppendHead("/head.html")
  );

  // =========================================================
  // 2) HEADER (UNICO)
  // =========================================================
  let headerFile = null;

  if (!isAdminPage) {
    headerFile = "header.html"; // ⭐ unico header
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

  const headerPromise = headerFile
    ? safeFetchHeader(headerFile).catch(() =>
        safeFetchHeader("/" + headerFile)
      )
    : Promise.resolve();

  // =========================================================
  // 3) AUTH (caricato DOPO header)
  // =========================================================
  const authPromise = headerPromise.then(() => {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "auth.js";
      s.onload = () => {
        console.log("[LOADER] auth.js caricato");
        resolve();
      };
      document.head.appendChild(s);
    });
  });

  // =========================================================
  // 4) HEADER.JS (dinamico)
  // =========================================================
  const headerLogicPromise = authPromise.then(() => {
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
  // 5) FOOTER
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
  // 6) CARRELLO (solo dopo header.js)
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
  // 7) ADMIN LOADER
  // =========================================================
  document.addEventListener("auth-ready", () => {
    if (window.isAdmin) {
      const s = document.createElement("script");
      s.src = "admin/loader-admin.js";
      document.body.appendChild(s);
    }
  });

})();
