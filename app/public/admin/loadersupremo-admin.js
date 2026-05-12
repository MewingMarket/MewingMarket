// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2055 (JAVA-MODE ORDINATO)
// Percorso reale: /app/public/admin/loadersupremo-admin.js
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER_2055__) {
  window.__SUPREMO_ADMIN_LOADER_2055__ = true;

  (function () {

    const V = "2055";

    // ============================================================
    // CACHE + LOCK LOCALE
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_ADMIN_RUN_STATE__ =
      window.__SUPREMO_ADMIN_RUN_STATE__ || {
        running: false,
        done: false
      };

    window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ =
      window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ || false;

    console.log("⚡ [SUPREMO ADMIN 2055] Inizializzazione SUPREMO ADMIN...");

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [SUPREMO ADMIN] LOAD-SKIP:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO ADMIN] LOAD-REQUEST:", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [SUPREMO ADMIN] LOAD-OK:", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [SUPREMO ADMIN] LOAD-FAIL:", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // NORMALIZZAZIONE NOME PAGINA ADMIN
    // ============================================================
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\.html?$/, "")
        .replace(/\.js$/, "")
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

    function getExpectedPageScript() {
      const base = getPageBase();
      return {
        base,
        src: `/admin/${base}.js`
      };
    }

    // ============================================================
    // Rileva se JS pagina admin è già nel DOM
    // ============================================================
    function paginaAdminHaJsDiPagina(expectedSrc) {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo-admin")) continue;
        if (src.includes("loader-admin")) continue;
        if (src.includes("loader-universale-admin")) continue;

        if (src === expectedSrc || src.startsWith(expectedSrc + "?")) {
          console.log("🔍 [SUPREMO ADMIN] JS pagina già presente:", src);
          return true;
        }
      }

      return false;
    }

    // ============================================================
    // SEQUENZA SUPREMO ADMIN (JAVA-MODE)
    // ============================================================
    async function runSupremoAdmin() {
      const state = window.__SUPREMO_ADMIN_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già completata");
        return;
      }
      if (state.running) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già in esecuzione");
        return;
      }

      state.running = true;

      // 0) Emissione critical-core-ready (spostato dal critical admin)
      console.log("🟦 [SUPREMO ADMIN 2055] Emissione critical-core-ready");
      document.dispatchEvent(new Event("critical-core-ready"));

      console.log("🟦 [SUPREMO ADMIN 2055] Avvio sequenza SUPREMO ADMIN");

      // 1) AUTH
      console.log("🔐 [SUPREMO ADMIN] Carico auth.js");
      await loadScript("/auth.js");

      // 2) SEO / STRUCTURED admin
      const p = window.location.pathname;

      const needSEO =
        p.includes("dashboard") ||
        p.includes("admin-prodotti") ||
        p.includes("admin-confronto");

      const needStructured =
        p.includes("admin-prodotti") ||
        p.includes("dashboard-vendite");

      if (needSEO) {
        console.log("🌐 [SUPREMO ADMIN] Carico seo-admin.js");
        await loadScript("/admin/seo-admin.js");
      }

      if (needStructured) {
        console.log("🌐 [SUPREMO ADMIN] Carico structured-data-admin.js");
        await loadScript("/admin/structured-data-admin.js");
      }

      // 3) HEADER ADMIN
      console.log("📌 [SUPREMO ADMIN] Carico header-admin.js");
      await loadScript("/admin/header-admin.js", "body");

      // 4) PAGE-JS diretto o universale fallback
      await new Promise(r => setTimeout(r, 0));

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 [SUPREMO ADMIN] Pagina normalizzata:", base);
      console.log("🔍 [SUPREMO ADMIN] Script pagina atteso:", expectedPageScript);

      if (paginaAdminHaJsDiPagina(expectedPageScript)) {
        console.log("📄 [SUPREMO ADMIN] JS pagina già presente → skip universale");
        document.dispatchEvent(new Event("page-js-loaded"));
      } else {
        if (!window.__LOADER_UNIVERSALE_ADMIN_CARICATO__) {
          window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = true;

          console.log("📦 [SUPREMO ADMIN] Carico loader-universale-admin.js (fallback)");
          await loadScript("/admin/loader-universale-admin.js");

          document.dispatchEvent(new Event("supremo-admin-load-universale"));
        }
      }

      // 5) Attesa page-js-loaded
      console.log("📄 [SUPREMO ADMIN] In attesa di page-js-loaded...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });

      console.log("📄 [SUPREMO ADMIN] page-js-loaded ricevuto");

      // 6) Dynamic admin loader
      console.log("🔄 [SUPREMO ADMIN] Carico dynamic-admin-loader.js");
      await loadScript("/admin/dynamic-admin-loader.js");

      // 7) Critical ready finale
      console.log("🟩 [SUPREMO ADMIN 2055] critical-ready (ADMIN)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));

      state.running = false;
      state.done = true;
    }

    // Trigger deterministico
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runSupremoAdmin, { once: true });
    } else {
      runSupremoAdmin();
    }

  })();
} else {
  console.warn("SUPREMO ADMIN 2055 già caricato, skip.");
}
