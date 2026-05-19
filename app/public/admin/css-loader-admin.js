// =========================================================
// CSS LOADER ADMIN — PATCH 2058 (A2 FORMATTATO)
// Carica /admin/style-admin.css + /admin/css/pagine/{page}.css
// =========================================================

if (!window.__CSS_LOADER_ADMIN_2058__) {
  window.__CSS_LOADER_ADMIN_2058__ = true;

  console.log("🎨 [CSS LOADER ADMIN 2058] Attivo");

  (function () {

    const VERSION = "2058";

    window.__CSS_LOADER_ADMIN_CACHE__ =
      window.__CSS_LOADER_ADMIN_CACHE__ || new Set();

    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .trim();
    }

    function getPageBase() {
      const p = window.location.pathname.replace("/admin/", "");

      if (p === "" || p === "/") return "admin-index";

      const parts = p.split("/").filter(Boolean);

      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      if (parts.length >= 2 && !parts[parts.length - 1].includes(".")) {
        return normalizeName(parts.join("-"));
      }

      return normalizeName(parts.pop());
    }

    function getExpectedPageCss() {
      const base = getPageBase();
      return `/admin/css/pagine/${base}.css`;
    }

    function loadCSS(href) {
      if (window.__CSS_LOADER_ADMIN_CACHE__.has(href)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${href}?v=${VERSION}`;

      link.onload = () => {
        window.__CSS_LOADER_ADMIN_CACHE__.add(href);
      };

      document.head.appendChild(link);
    }

    function removeLegacyCss() {
      document.querySelectorAll('link[href*="admin-standard.css"]').forEach(el => el.remove());
      document.querySelectorAll('link[href*="standard-admin.css"]').forEach(el => el.remove());
    }

    function runCssLoaderAdmin() {
      removeLegacyCss();

      loadCSS("/admin/style-admin.css");

      const pageCss = getExpectedPageCss();
      loadCSS(pageCss);
    }

    document.addEventListener("supremo-admin-load-css", runCssLoaderAdmin);

  })();
}
