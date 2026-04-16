// LOADER HEADER/FOOTER — Versione DEFINITIVA (2026 + CLEAN + SAFE + PATCH)
// Carica: auth.js → head → header → header.js → carrello → footer
// + SEO / Structured / Tracking (safe)
// + Versioning / Anti-cache / Anti-SW
// + PATCH 2027.200 — AUTO-INJECT api.js + SAFETY CHECK
// =========================================================

(function () {

  const VERSION = "20260412";

  /* =========================================================
     ⭐ PATCH 2027.200 — AUTO-INJECT api.js
  ========================================================= */
  (function ensureApiJs() {
    try {
      const exists = [...document.scripts].some(s => s.src.includes("/api.js"));
      if (!exists) {
        const s = document.createElement("script");
        s.src = "/api.js?v=" + VERSION;
        s.onload = () => console.log("🟩 [LOADER] api.js caricato automaticamente");
        s.onerror = () => console.error("🟥 [LOADER] ERRORE: impossibile caricare api.js");
        document.head.appendChild(s);
      } else {
        console.log("🟦 [LOADER] api.js già presente");
      }
    } catch (e) {
      console.error("🟥 [LOADER] Errore auto-inject api.js:", e);
    }
  })();

  /* =========================================================
     ⭐ PATCH 2027.200 — SAFETY CHECK apiFetch
  ========================================================= */
  (function ensureApiFetch() {
    const check = () => {
      if (typeof window.apiFetch === "function") {
        console.log("🟩 [LOADER] apiFetch OK");
        return;
      }
      console.warn("🟧 [LOADER] apiFetch NON definito → ritento…");
      setTimeout(check, 200);
    };
    check();
  })();

  // =========================================================
  // MINI ANTI-CACHE CLIENT
  // =========================================================
  (function ensureNoCacheMeta() {
    try {
      const hasCacheMeta = !!document.querySelector('meta[http-equiv="Cache-Control"]');
      if (!hasCacheMeta) {
        const m1 = document.createElement("meta");
        m1.httpEquiv = "Cache-Control";
        m1.content = "no-cache, no-store, must-revalidate";
        document.head.appendChild(m1);

        const m2 = document.createElement("meta");
        m2.httpEquiv = "Pragma";
        m2.content = "no-cache";
        document.head.appendChild(m2);

        const m3 = document.createElement("meta");
        m3.httpEquiv = "Expires";
        m3.content = "0";
        document.head.appendChild(m3);

        console.log("[LOADER] Meta anti-cache aggiunti");
      }
    } catch (e) {
      console.warn("[LOADER] Anti-cache meta error (ignorato):", e);
    }
  })();

  // =========================================================
  // ANTI SERVICE WORKER + CLEAR CACHE
  // =========================================================
  (function removeServiceWorkers() {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }

      if (window.caches) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }

      console.log("[LOADER] Service worker e cache rimossi");
    } catch (e) {
      console.warn("[LOADER] Errore rimozione SW/cache (ignorato):", e);
    }
  })();

  // =========================================================
  // CARICATORI SAFE (NO IMPORT, NO MODULE, NO ASYNC CRITICO)
  // =========================================================
  function loadUtilityScript(name) {
    try {
      const id = `util-${name}`;
      if (document.getElementById(id)) return;

      const s = document.createElement("script");
      s.id = id;
      s.src = `/${name}.js?v=${VERSION}`;
      s.onload = () => console.log(`[LOADER] ${name}.js caricato`);
      s.onerror = () => console.warn(`[LOADER] ${name}.js non trovato (ignorato)`);
      document.head.appendChild(s);

    } catch (e) {
      console.warn(`[LOADER] Errore caricamento ${name}.js (ignorato):`, e);
    }
  }

  loadUtilityScript("seo");
  loadUtilityScript("structured-data");
  loadUtilityScript("tracking");

  // =========================================================
  // LOGICA ORIGINALE — INALTERATA
  // =========================================================

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

  const isGlobalPage = !isShopPage && !isAdminPage && !isUserPage && !isHome;

  console.log("[LOADER] Page:", { isHome, isShopPage, isAdminPage, isUserPage, isGlobalPage });

  // =========================================================
  // 0) AUTH — PRIMA DI TUTTO
  // =========================================================
  const authPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = `/auth.js?v=${VERSION}`;
    s.onload = () => {
      console.log("[LOADER] auth.js caricato (PRIMA DI TUTTO)");
      resolve();
    };
    s.onerror = () => {
      console.error("[LOADER] ERRORE: impossibile caricare auth.js");
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
      })
      .catch((err) => {
        console.error("[LOADER] Errore caricamento HEAD:", url, err);
      });
  }

  const headPromise = authPromise.then(() =>
    safeFetchAppendHead(`head.html?v=${VERSION}`).catch(() =>
      safeFetchAppendHead(`/head.html?v=${VERSION}`)
    )
  );

  // =========================================================
  // 2) HEADER
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
        if (!ph) {
          console.warn("[LOADER] header-placeholder mancante");
          return;
        }
        ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
      })
      .catch((err) => {
        console.error("[LOADER] Errore caricamento HEADER:", url, err);
      });
  }

  const headerPromise = headPromise.then(() =>
    headerFile
      ? safeFetchHeader(`${headerFile}?v=${VERSION}`).catch(() =>
          safeFetchHeader(`/${headerFile}?v=${VERSION}`)
        )
      : Promise.resolve()
  );

  // =========================================================
  // 3) HEADER.JS
  // =========================================================
  let headerLogicPromise = Promise.resolve();

  if (!isAdminPage) {
    headerLogicPromise = headerPromise.then(() => {
      return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = `header.js?v=${VERSION}`;
        s.onload = () => {
          console.log("[LOADER] header.js caricato");
          resolve();
        };
        s.onerror = () => {
          console.error("[LOADER] ERRORE: impossibile caricare header.js");
          resolve();
        };
        document.body.appendChild(s);
      });
    });
  }

  // =========================================================
  // 4) FOOTER
  // =========================================================
  function safeFetchFooter(url) {
    return fetch(url)
      .then((r) => r.text())
      .then((html) => {
        const ph = document.getElementById("footer-placeholder");
        if (!ph) {
          console.warn("[LOADER] footer-placeholder mancante");
          return;
        }
        ph.innerHTML = html;
        const year = document.getElementById("anno");
        if (year) year.textContent = new Date().getFullYear();
        document.dispatchEvent(new Event("footer-loaded"));
      })
      .catch((err) => {
        console.error("[LOADER] Errore caricamento FOOTER:", url, err);
      });
  }

  safeFetchFooter(`footer.html?v=${VERSION}`).catch(() =>
    safeFetchFooter(`/footer.html?v=${VERSION}`)
  );

  // =========================================================
  // 5) CARRELLO
  // =========================================================
  let cartPromise = Promise.resolve();

  if (!isAdminPage) {
    cartPromise = headerLogicPromise.then(() => {
      return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = `carrello.js?v=${VERSION}`;
        s.onload = () => {
          console.log("[LOADER] carrello.js caricato");
          resolve();
        };
        s.onerror = () => {
          console.error("[LOADER] ERRORE: impossibile caricare carrello.js");
          resolve();
        };
        document.body.appendChild(s);
      });
    });
  }

  // =========================================================
  // 6) ADMIN LOADER
  // =========================================================
  document.addEventListener("auth-ready", () => {
    if (autoLogoutTriggered) {
      console.log("[LOADER] Admin loader BLOCCATO (logout automatico)");
      return;
    }

    headerLogicPromise.then(() => {
      if (autoLogoutTriggered) {
        console.log("[LOADER] Admin loader BLOCCATO (logout automatico, post-header)");
        return;
      }

      if (window.isAdmin === true && autoLogoutTriggered === false) {
        console.log("[LOADER] Carico admin (utente admin reale, stato verificato post-header)");
        const s = document.createElement("script");
        s.src = `/admin/loader-admin.js?v=${VERSION}`;
        s.onload = () => console.log("[LOADER] loader-admin.js caricato");
        s.onerror = () => console.error("[LOADER] ERRORE: impossibile caricare loader-admin.js");
        document.body.appendChild(s);
      } else {
        console.log("[LOADER] Admin NON caricato (stato finale non admin)");
      }
    });
  });

  // =========================================================
  // 7) DIAGNOSTICA FRONTEND (SAFE, NON BLOCCA NULLA)
  // =========================================================
  try {
    const s = document.createElement("script");
    s.src = `/frontend-diagnostica.js?v=${VERSION}`;
    s.onload = () => console.log("[LOADER] frontend-diagnostica.js caricato");
    s.onerror = () => console.warn("[LOADER] frontend-diagnostica.js non trovato (ignorato)");
    document.head.appendChild(s);
  } catch (e) {
    console.warn("[LOADER] Errore caricamento diagnostica (ignorato):", e);
  }

})();
