// =========================================================
// LOADER UNIVERSALE — app/public/loader-header-footer.js
// =========================================================

(function () {
  // ------------------------
  // Utility
  // ------------------------
  function normalize(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")   // rimuove estensione
      .replace(/[^a-z0-9]/g, "")  // solo lettere/numeri
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
    if (isHome) return false; // home la forziamo global
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

  console.log("[LOADER] rawPath:", rawPath);
  console.log("[LOADER] pageName:", pageName);
  console.log("[LOADER] isHome:", isHome);
  console.log("[LOADER] isAdminPage:", isAdminPage);
  console.log("[LOADER] isShopPage:", isShopPage);
  console.log("[LOADER] isUserPage:", isUserPage);
  console.log("[LOADER] isGlobalPage:", isGlobalPage);

  // =========================================================
  // 1) HEAD
  // =========================================================
  function safeFetchAppendHead(url) {
    return fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
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
  // 2) AUTH (sempre, così non sbagliamo mai)
  // =========================================================
  (function loadAuth() {
    const s = document.createElement("script");
    s.src = "auth.js";
    s.onload = () => console.log("[LOADER] auth.js caricato");
    s.onerror = () => console.error("[LOADER] ERRORE auth.js");
    document.head.appendChild(s);
  })();

  // =========================================================
  // 3) HEADER
  // =========================================================
  let headerFile = null;

  if (isAdminPage) {
    headerFile = null;
  } else if (isShopPage) {
    headerFile = "header-shop.html";
  } else {
    // global + home
    headerFile = "header.html";
  }

  function safeFetchHeader(url) {
    return fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then((html) => {
        const ph = document.getElementById("header-placeholder");
        if (!ph) {
          console.warn("[LOADER] header-placeholder non trovato");
          return;
        }
        ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));

        // header-shop.js: lo carichiamo su pagine shop
        // e anche su home (ma con badge nascosto)
        if (url.includes("header-shop.html") || isHome) {
          const s = document.createElement("script");
          s.src = "header-shop.js";
          s.onload = () => {
            console.log("[LOADER] header-shop.js caricato");
            if (isHome) {
              // nascondi badge carrello in home
              const hideBadge = () => {
                const badge =
                  document.querySelector("#cart-badge") ||
                  document.querySelector(".cart-badge");
                if (badge) badge.style.display = "none";
              };
              hideBadge();
              document.addEventListener("DOMContentLoaded", hideBadge);
            }
          };
          s.onerror = () =>
            console.error("[LOADER] ERRORE header-shop.js");
          document.body.appendChild(s);
        }
      });
  }

  if (headerFile) {
    safeFetchHeader(headerFile).catch(() =>
      safeFetchHeader("/" + headerFile)
    );
  }

  // =========================================================
  // 4) FOOTER
  // =========================================================
  function safeFetchFooter(url) {
    return fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then((html) => {
        const ph = document.getElementById("footer-placeholder");
        if (!ph) {
          console.warn("[LOADER] footer-placeholder non trovato");
          return;
        }
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
  // 5) CARRELLO (shop + home, ma invisibile in home)
  // =========================================================
  function loadCartScript(src) {
    return new Promise((resolve, reject) => {
      const cartScript = document.createElement("script");
      cartScript.src = src;
      cartScript.onload = () => {
        console.log("[LOADER] carrello.js caricato da", src);
        if (isHome) {
          const hideBadge = () => {
            const badge =
              document.querySelector("#cart-badge") ||
              document.querySelector(".cart-badge");
            if (badge) badge.style.display = "none";
          };
          hideBadge();
          document.addEventListener("DOMContentLoaded", hideBadge);
        }
        resolve();
      };
      cartScript.onerror = () => {
        console.error("[LOADER] ERRORE carrello.js da", src);
        reject(new Error("Errore caricamento carrello.js"));
      };
      document.body.appendChild(cartScript);
    });
  }

  if (isShopPage || isHome) {
    loadCartScript("carrello.js").catch(() => loadCartScript("/carrello.js").catch(() => {
      console.error("[LOADER] Impossibile caricare carrello.js");
    }));
  }

  // =========================================================
  // 6) POPUP POST-LOGIN (profilo / naviga)
  // =========================================================
  function showPostLoginPopupIfNeeded() {
    const flag = localStorage.getItem("showLoginChoice");
    if (flag !== "1") return;

    localStorage.removeItem("showLoginChoice");

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.55)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "99999";

    const box = document.createElement("div");
    box.style.width = "90%";
    box.style.maxWidth = "380px";
    box.style.background = "#fff";
    box.style.borderRadius = "14px";
    box.style.padding = "24px";
    box.style.boxShadow = "0 8px 30px rgba(0,0,0,0.25)";
    box.style.textAlign = "center";
    box.style.fontFamily = "system-ui, sans-serif";

    const title = document.createElement("h2");
    title.textContent = "Cosa vuoi fare adesso?";
    title.style.margin = "0 0 10px 0";

    const text = document.createElement("p");
    text.textContent =
      "Scegli se modificare il tuo profilo o continuare a navigare nel sito.";
    text.style.margin = "0 0 20px 0";

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.flexDirection = "column";
    btnContainer.style.gap = "10px";

    const btnProfilo = document.createElement("button");
    btnProfilo.textContent = "Modifica profilo";
    btnProfilo.style.padding = "12px";
    btnProfilo.style.fontSize = "16px";
    btnProfilo.style.border = "none";
    btnProfilo.style.borderRadius = "8px";
    btnProfilo.style.background = "#007bff";
    btnProfilo.style.color = "#fff";
    btnProfilo.onclick = () => {
      overlay.remove();
      window.location.href = "dashboard.html";
    };

    const btnNaviga = document.createElement("button");
    btnNaviga.textContent = "Naviga nel sito";
    btnNaviga.style.padding = "12px";
    btnNaviga.style.fontSize = "16px";
    btnNaviga.style.border = "1px solid #ccc";
    btnNaviga.style.borderRadius = "8px";
    btnNaviga.style.background = "#f7f7f7";
    btnNaviga.onclick = () => {
      overlay.remove();
      window.location.href = "index.html";
    };

    btnContainer.appendChild(btnProfilo);
    btnContainer.appendChild(btnNaviga);
    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(btnContainer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  document.addEventListener("auth-ready", () => {
    showPostLoginPopupIfNeeded();

    // =====================================================
    // 7) LOADER ADMIN (solo se admin)
    // =====================================================
    if (window.isAdmin) {
      const s = document.createElement("script");
      s.src = "admin/loader-admin.js";
      s.onload = () =>
        console.log("[LOADER] loader-admin.js caricato");
      s.onerror = () =>
        console.error("[LOADER] ERRORE loader-admin.js");
      document.body.appendChild(s);
    }
  });
})();
