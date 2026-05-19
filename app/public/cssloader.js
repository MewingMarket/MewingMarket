// =========================================================
// CSS LOADER — PATCH 2058 (A2 FORMATTATO)
// Carica style.css + css/pagine/{page}.css
// Compatibile con SUPREMO 2058 + UNIVERSALE 2058
// =========================================================

if (!window.__CSS_LOADER_2058__) {
  window.__CSS_LOADER_2058__ = true;

  console.log("🎨 [CSS LOADER 2058] Attivo");

  (function () {

    const VERSION = "2058";

    // Cache per evitare doppi caricamenti
    window.__CSS_LOADER_CACHE__ =
      window.__CSS_LOADER_CACHE__ || new Set();

    // ============================================================
    // NORMALIZZAZIONE NOME PAGINA
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .trim();
    }

    function getPageBaseFromPath() {
      const p = window.location.pathname;

      if (p === "/" || p === "") return "index";

      const parts = p.split("/").filter(Boolean);

      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      if (parts.length >= 2 && !parts[parts.length - 1].includes(".")) {
        return normalizeName(parts.join("-"));
      }

      return normalizeName(parts.pop());
    }

    function getPageId() {
      if (typeof window.__PAGE_ID__ === "string" && window.__PAGE_ID__.trim()) {
        return normalizeName(window.__PAGE_ID__);
      }
      return getPageBaseFromPath();
    }

    function getExpectedPageCss() {
      const base = getPageId();
      return {
        base,
        href: `/css/pagine/${base}.css`
      };
    }

    // ============================================================
    // CARICA CSS (SAFE)
    // ============================================================
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

    // ============================================================
    // RIMOZIONE CSS OBSOLETI
    // ============================================================
    function removeLegacyCss() {
      const selectors = [
        'link[href*="pagine-standard.css"]',
        'link[href*="standard.css"]',
        'link[href*="global.css"]'
      ];

      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          console.log("🗑️ [CSS LOADER] Rimozione CSS obsoleto:", el.href);
          el.remove();
        });
      });
    }

    // ============================================================
    // AVVIO CSS LOADER
    // ============================================================
    function runCssLoader() {
      console.log("🟦 [CSS LOADER] Avvio…");

      removeLegacyCss();

      // 1) CSS globale
      loadCSS("/style.css");

      // 2) CSS pagina
      const { href: pageCss } = getExpectedPageCss();
      loadCSS(pageCss);

      console.log("🟩 [CSS LOADER] Completato");
    }

    // ============================================================
    // LISTENER DA SUPREMO
    // ============================================================
    document.addEventListener("supremo-public-load-css", runCssLoader);

  })();
}
