// =========================================================
// CSS LOADER ADMIN — PATCH 2058 (A2 FORMATTATO)
// Carica SOLO: /admin/dashboard-admin.css
// =========================================================

if (!window.__CSS_LOADER_ADMIN_2058__) {
  window.__CSS_LOADER_ADMIN_2058__ = true;

  console.log("🎨 [CSS LOADER ADMIN 2058] Attivo (single CSS mode)");

  (function () {

    const VERSION = "2058";

    window.__CSS_LOADER_ADMIN_CACHE__ =
      window.__CSS_LOADER_ADMIN_CACHE__ || new Set();

    // ============================================================
    // RIMOZIONE CSS OBSOLETI
    // ============================================================
    function removeLegacyCss() {
      const selectors = [
        'link[href*="admin-standard.css"]',
        'link[href*="standard-admin.css"]',
        'link[href*="pagine-standard.css"]',
        'link[href*="style-admin.css"]',
        'link[href*="admin/style.css"]'
      ];

      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          console.log("🗑️ [CSS LOADER ADMIN] Rimozione CSS obsoleto:", el.href);
          el.remove();
        });
      });
    }

    // ============================================================
    // CARICA CSS (SAFE)
    // ============================================================
    function loadCSS(href) {
      if (window.__CSS_LOADER_ADMIN_CACHE__.has(href)) {
        console.log("⏭️ [CSS LOADER ADMIN] LOAD-SKIP:", href);
        return;
      }

      console.log("➡️ [CSS LOADER ADMIN] LOAD-REQUEST:", href);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${href}?v=${VERSION}`;

      link.onload = () => {
        console.log("✅ [CSS LOADER ADMIN] LOAD-OK:", href);
        window.__CSS_LOADER_ADMIN_CACHE__.add(href);
      };

      link.onerror = () => {
        console.warn("❌ [CSS LOADER ADMIN] LOAD-FAIL:", href);
      };

      document.head.appendChild(link);
    }

    // ============================================================
    // AVVIO CSS LOADER ADMIN
    // ============================================================
    function runCssLoaderAdmin() {
      console.log("🟦 [CSS LOADER ADMIN] Avvio…");

      removeLegacyCss();

      // CSS unico admin
      loadCSS("/admin/dashboard-admin.css");

      console.log("🟩 [CSS LOADER ADMIN] Completato");
    }

    // ============================================================
    // LISTENER DA SUPREMO ADMIN
    // ============================================================
    document.addEventListener("supremo-admin-load-css", runCssLoaderAdmin);

  })();
}
