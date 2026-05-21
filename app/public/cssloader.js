// =========================================================
// CSS LOADER — PUBLIC PATCH 2058 (VERSIONE DEFINITIVA)
// Percorso reale: /app/public/cssloader.js
// Carica: /style.css + /footer.css + {pagina}.css + header-shop.css (solo shop)
// Usa SOLO i nomi REALI dei file nella cartella
// =========================================================

if (!window.__CSS_LOADER_PUBLIC_2058__) {
  window.__CSS_LOADER_PUBLIC_2058__ = true;

  console.log("🎨 [CSS LOADER PUBLIC 2058] Attivo (versione definitiva)");

  (function () {

    const VERSION = "2058";

    window.__CSS_LOADER_CACHE__ =
      window.__CSS_LOADER_CACHE__ || new Set();

    // ============================================================
    // NORMALIZZAZIONE NOME FILE REALE
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/\.css$/, "")
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/\-+/g, "-")
        .trim();
    }

    // ============================================================
    // LETTURA STRUTTURA REALE → index.html → index.css
    // ============================================================
    function getPageBaseFromPath() {
      const p = window.location.pathname;

      // Homepage → index.css
      if (p === "/" || p === "") return "index";

      const parts = p.split("/").filter(Boolean);
      const last = parts[parts.length - 1];

      // Se non ha estensione → è una cartella → usa il nome reale
      if (!last.includes(".")) return normalizeName(last);

      // Se è un file → togli estensione
      return normalizeName(last.replace(/\.html?$/, ""));
    }

    function getPageId() {
      if (typeof window.__PAGE_ID__ === "string" && window.__PAGE_ID__.trim()) {
        return normalizeName(window.__PAGE_ID__);
      }
      return getPageBaseFromPath();
    }

    // ============================================================
    // COSTRUZIONE PERCORSO CSS REALE
    // ============================================================
    function getPageCssHref() {
      const base = getPageId(); // es: index, profilo, recensioni
      const path = window.location.pathname;

      // stessa cartella dell'HTML
      const dir = path.endsWith("/")
        ? path
        : path.substring(0, path.lastIndexOf("/") + 1);

      return `${dir}${base}.css`;
    }

    // ============================================================
    // CARICA CSS (SAFE)
// ============================================================
    function loadCSS(href) {
      if (window.__CSS_LOADER_CACHE__.has(href)) {
        console.log("⏭️ [CSS LOADER PUBLIC] LOAD-SKIP:", href);
        return;
      }

      console.log("➡️ [CSS LOADER PUBLIC] LOAD-REQUEST:", href);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${href}?v=${VERSION}`;

      link.onload = () => {
        console.log("✅ [CSS LOADER PUBLIC] LOAD-OK:", href);
        window.__CSS_LOADER_CACHE__.add(href);
      };

      link.onerror = () => {
        console.warn("❌ [CSS LOADER PUBLIC] LOAD-FAIL:", href);
      };

      document.head.appendChild(link);
    }

    // ============================================================
    // RIMOZIONE CSS HTML (SAFE)
    // ============================================================
    function removeLegacyCss() {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
        const href = el.getAttribute("href") || "";

        // Rimuove TUTTI i CSS HTML, lasciando solo quelli caricati dal loader
        if (href.endsWith(".css")) {
          console.log("🗑️ [CSS LOADER PUBLIC] Rimozione CSS HTML:", href);
          el.remove();
        }
      });
    }

    // ============================================================
    // PAGINE SHOP (header-shop.css)
    // ============================================================
    function isShopPage() {
      const p = window.location.pathname.toLowerCase();
      return (
        p === "/" ||
        p.includes("index") ||
        p.includes("catalogo") ||
        p.includes("prodotto")
      );
    }

    // ============================================================
    // AVVIO CSS LOADER PUBLIC
    // ============================================================
    function runCssLoader() {
      console.log("🟦 [CSS LOADER PUBLIC] Avvio…");

      removeLegacyCss();

      // CSS globali
      loadCSS("/style.css");
      loadCSS("/footer.css");

      // CSS pagina reale
      const pageCss = getPageCssHref();
      loadCSS(pageCss);

      // CSS shop
      if (isShopPage()) {
        loadCSS("/header-shop.css");
      }

      console.log("🟩 [CSS LOADER PUBLIC] Completato");
    }

    document.addEventListener("supremo-public-load-css", runCssLoader);

  })();
}
