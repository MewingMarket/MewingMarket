// =========================================================
// CSS LOADER — PATCH 2058 (A2 PAGINA-LOCALE)
// Carica /style.css + /footer.css + {page}.css (stessa cartella HTML)
// =========================================================

if (!window.__CSS_LOADER_2058__) {
  window.__CSS_LOADER_2058__ = true;

  console.log("🎨 [CSS LOADER 2058] Attivo");

  (function () {

    const VERSION = "2058";

    window.__CSS_LOADER_CACHE__ =
      window.__CSS_LOADER_CACHE__ || new Set();

    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/\-+/g, "-")
        .trim();
    }

    function getPageBaseFromPath() {
      const p = window.location.pathname;

      if (p === "/" || p === "") return "index";

      const parts = p.split("/").filter(Boolean);
      const last = parts[parts.length - 1];

      if (!last.includes(".")) return normalizeName(last);
      return normalizeName(last);
    }

    function getPageId() {
      if (typeof window.__PAGE_ID__ === "string" && window.__PAGE_ID__.trim()) {
        return normalizeName(window.__PAGE_ID__);
      }
      return getPageBaseFromPath();
    }

    function getPageCssHref() {
      const base = getPageId();
      // CSS nella stessa cartella dell'HTML
      const path = window.location.pathname;
      const dir = path.endsWith("/") ? path : path.substring(0, path.lastIndexOf("/") + 1);
      return dir + base + ".css";
    }

    function loadCSS(href) {
      if (window.__CSS_LOADER_CACHE__.has(href)) {
        console.log("⏭️ [CSS LOADER] LOAD-SKIP:", href);
        return;
      }

      console.log("➡️ [CSS LOADER] LOAD-REQUEST:", href);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${href}?v=${VERSION}`;

      link.onload = () => {
        console.log("✅ [CSS LOADER] LOAD-OK:", href);
        window.__CSS_LOADER_CACHE__.add(href);
      };

      link.onerror = () => {
        console.warn("❌ [CSS LOADER] LOAD-FAIL:", href);
      };

      document.head.appendChild(link);
    }

    function removeLegacyCss() {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
        const href = el.getAttribute("href") || "";
        if (
          href.includes("style.css") ||
          href.includes("footer.css") ||
          href.endsWith(".css")
        ) {
          console.log("🗑️ [CSS LOADER] Rimozione CSS HTML:", href);
          el.remove();
        }
      });
    }

    function runCssLoader() {
      console.log("🟦 [CSS LOADER] Avvio…");

      removeLegacyCss();

      // CSS globali
      loadCSS("/style.css");
      loadCSS("/footer.css");

      // CSS pagina (stessa cartella)
      const pageCss = getPageCssHref();
      loadCSS(pageCss);

      console.log("🟩 [CSS LOADER] Completato");
    }

    document.addEventListener("supremo-public-load-css", runCssLoader);

  })();
}
