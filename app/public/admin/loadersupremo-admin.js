// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2050 (ORDINE PERFETTO)
// Percorso reale: /app/public/admin/loadersupremo-admin.js
// =========================================================

if (!window.__SUPREMO_ADMIN_LOADER__) {
  window.__SUPREMO_ADMIN_LOADER__ = true;

  (function() {

    const V = "2050";

    // ============================================================
    // CACHE + LOCK LOCALE
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__SUPREMO_ADMIN_RUN_STATE__ = window.__SUPREMO_ADMIN_RUN_STATE__ || {
      running: false,
      done: false
    };

    window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = false;

    console.log("⚡ [SUPREMO ADMIN 2050] In attesa di critical-core-ready...");

    // ============================================================
    // Utility caricamento script
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [LOAD-SKIP]", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [LOAD-REQUEST]", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [LOAD-OK]", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [LOAD-FAIL]", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // Import debug
    // ============================================================
    async function debugImport(src) {
      const key = src + "::import";

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [IMPORT-SKIP]", src);
        return;
      }

      try {
        await import(src + "?v=" + V);
        console.log("📦 [IMPORT-OK]", src);
        window.__SUPREMO_JS_CACHE__.add(key);
      } catch (e) {
        console.warn("📦❌ [IMPORT-FAIL]", src, e.message);
      }
    }

    // ============================================================
    // NORMALIZZAZIONE NOME PAGINA
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
    // PATCH: rileva se la pagina admin ha JS di pagina (DOM-SAFE)
    // con confronto sullo script atteso
    // ============================================================
    function paginaAdminHaJsDiPagina(expectedSrc) {
      const scripts = document.querySelectorAll("script[src]");

      for (const s of scripts) {
        const src = s.getAttribute("src");
        if (!src) continue;

        if (src.includes("loadersupremo-admin")) continue;
        if (src.includes("loader-admin")) continue;
        if (src.includes("loader-universale-admin")) continue;

        // match diretto con lo script atteso (con o senza ?v=)
        if (src === expectedSrc || src.startsWith(expectedSrc + "?")) {
          console.log("🔍 [SUPREMO ADMIN] JS pagina già presente nel DOM:", src);
          return true;
        }
      }

      return false;
    }

    // ============================================================
    // Sequenza ADMIN dopo critical-core-ready
    // ============================================================
    document.addEventListener("critical-core-ready", async () => {

      const state = window.__SUPREMO_ADMIN_RUN_STATE__;

      if (state.done) return console.log("⏭️ Sequenza già completata");
      if (state.running) return console.log("⏭️ Sequenza già in esecuzione");

      state.running = true;

      console.log("🟦 [SUPREMO ADMIN 2050] critical-core-ready ricevuto");

      // ============================================================
      // 1) AUTH
      // ============================================================
      console.log("🔐 Carico auth.js");
      await loadScript("/auth.js");
      await debugImport("/auth.js");

      // ============================================================
      // 2) SEO / STRUCTURED admin (già condizionale)
      // ============================================================
      const p = window.location.pathname;

      const needSEO =
        p.includes("dashboard") ||
        p.includes("admin-prodotti") ||
        p.includes("admin-confronto");

      const needStructured =
        p.includes("admin-prodotti") ||
        p.includes("dashboard-vendite");

      if (needSEO) {
        console.log("🌐 Carico seo-admin.js");
        await loadScript("/admin/seo-admin.js");
        await debugImport("/admin/seo-admin.js");
      }

      if (needStructured) {
        console.log("🌐 Carico structured-data-admin.js");
        await loadScript("/admin/structured-data-admin.js");
        await debugImport("/admin/structured-data-admin.js");
      }

      // ============================================================
      // 3) HEADER ADMIN
      // ============================================================
      console.log("📌 Carico header-admin.js");
      await loadScript("/admin/header-admin.js", "body");
      await debugImport("/admin/header-admin.js");

      // ============================================================
      // 4) LOADER UNIVERSALE ADMIN — SOLO SE SERVE
      // ============================================================
      await new Promise(r => setTimeout(r, 0));

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 [SUPREMO ADMIN] Pagina normalizzata:", base);
      console.log("🔍 [SUPREMO ADMIN] Script pagina atteso:", expectedPageScript);

      if (paginaAdminHaJsDiPagina(expectedPageScript)) {
        // JS di pagina già presente → NON carico l’universale
        console.log("📄 [SUPREMO ADMIN] JS pagina già presente → skip loader-universale-admin.js");
        console.log("🟩 [SUPREMO ADMIN] page-js-loaded (diretto, senza universale)");
        document.dispatchEvent(new Event("page-js-loaded"));
      } else {
        // JS di pagina mancante → uso l’universale come fallback
        if (!window.__LOADER_UNIVERSALE_ADMIN_CARICATO__) {
          window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = true;

          console.log("📦 Carico loader-universale-admin.js (fallback JS pagina)");
          await loadScript("/admin/loader-universale-admin.js");

          // 🔥 Evento che FA PARTIRE l’universale admin
          document.dispatchEvent(new Event("supremo-admin-load-universale"));
        } else {
          console.log("⏭️ [SUPREMO ADMIN] loader-universale-admin.js già caricato in precedenza");
        }
      }

      // ============================================================
      // 5) Attesa page-js-loaded
      // ============================================================
      console.log("📄 In attesa di page-js-loaded...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });
      console.log("📄 page-js-loaded ricevuto");

      // ============================================================
      // 6) DYNAMIC ADMIN LOADER
      // ============================================================
      console.log("🔄 Carico dynamic-admin-loader.js");
      await loadScript("/admin/dynamic-admin-loader.js");
      await debugImport("/admin/dynamic-admin-loader.js");

      // ============================================================
      // 7) CRITICAL READY FINALE
      // ============================================================
      console.log("🟩 critical-ready (ADMIN 2050)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));

      state.running = false;
      state.done = true;
    });

  })();
} else {
  console.warn("SUPREMO ADMIN già caricato, skip.");
}
