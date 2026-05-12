// =========================================================
// LOADER SUPREMO — ADMIN MODELLO 2055 (ORDINE PERFETTO)
// Percorso reale: /app/public/admin/loadersupremo-admin.js
// Ruolo: carica JS globali admin, poi page‑JS diretto o universale come FALLBACK
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

    // evita doppio universale admin
    window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ =
      window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ || false;

    console.log("⚡ [SUPREMO ADMIN 2055] In attesa di critical-core-ready...");

    // ============================================================
    // Utility caricamento script (SENZA import(), niente doppio load)
    // ============================================================
    function loadScript(src, where = "head") {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [SUPREMO ADMIN] LOAD-SKIP già caricato:", key);
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        console.log("➡️ [SUPREMO ADMIN] LOAD-REQUEST", key);

        const s = document.createElement("script");
        s.src = `${key}?v=${V}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [SUPREMO ADMIN] LOAD-OK", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [SUPREMO ADMIN] LOAD-FAIL", key);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
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

      if (state.done) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già completata");
        return;
      }
      if (state.running) {
        console.log("⏭️ [SUPREMO ADMIN] Sequenza già in esecuzione");
        return;
      }

      state.running = true;

      console.log("🟦 [SUPREMO ADMIN 2055] critical-core-ready ricevuto");

      // ============================================================
      // 1) AUTH (globale, una sola volta)
      // ============================================================
      console.log("🔐 [SUPREMO ADMIN] Carico auth.js");
      await loadScript("/auth.js");

      // ============================================================
      // 2) SEO / STRUCTURED admin (condizionale)
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
        console.log("🌐 [SUPREMO ADMIN] Carico seo-admin.js");
        await loadScript("/admin/seo-admin.js");
      }

      if (needStructured) {
        console.log("🌐 [SUPREMO ADMIN] Carico structured-data-admin.js");
        await loadScript("/admin/structured-data-admin.js");
      }

      // ============================================================
      // 3) HEADER ADMIN (globale)
      // ============================================================
      console.log("📌 [SUPREMO ADMIN] Carico header-admin.js");
      await loadScript("/admin/header-admin.js", "body");

      // ============================================================
      // 4) PAGE-JS: diretto se presente, altrimenti universale FALLBACK
      // ============================================================
      await new Promise(r => setTimeout(r, 0)); // lascia finire parsing DOM

      const { base, src: expectedPageScript } = getExpectedPageScript();
      console.log("🔍 [SUPREMO ADMIN] Pagina normalizzata:", base);
      console.log("🔍 [SUPREMO ADMIN] Script pagina atteso:", expectedPageScript);

      if (paginaAdminHaJsDiPagina(expectedPageScript)) {
        console.log("📄 [SUPREMO ADMIN] JS pagina già presente → skip loader-universale-admin.js");
        console.log("🟩 [SUPREMO ADMIN] page-js-loaded (diretto, senza universale)");
        document.dispatchEvent(new Event("page-js-loaded"));
      } else {
        if (!window.__LOADER_UNIVERSALE_ADMIN_CARICATO__) {
          window.__LOADER_UNIVERSALE_ADMIN_CARICATO__ = true;

          console.log("📦 [SUPREMO ADMIN] Carico loader-universale-admin.js (FALLBACK JS pagina)");
          await loadScript("/admin/loader-universale-admin.js");

          document.dispatchEvent(new Event("supremo-admin-load-universale"));
        } else {
          console.log("⏭️ [SUPREMO ADMIN] loader-universale-admin.js già caricato in precedenza");
        }
      }

      // ============================================================
      // 5) Attesa page-js-loaded
      // ============================================================
      console.log("📄 [SUPREMO ADMIN] In attesa di page-js-loaded...");
      await new Promise(resolve => {
        document.addEventListener("page-js-loaded", resolve, { once: true });
      });
      console.log("📄 [SUPREMO ADMIN] page-js-loaded ricevuto");

      // ============================================================
      // 6) DYNAMIC ADMIN LOADER (anti-cache / anti-SW)
      // ============================================================
      console.log("🔄 [SUPREMO ADMIN] Carico dynamic-admin-loader.js");
      await loadScript("/admin/dynamic-admin-loader.js");

      // ============================================================
      // 7) CRITICAL READY FINALE (ADMIN)
      // ============================================================
      console.log("🟩 [SUPREMO ADMIN 2055] critical-ready (ADMIN)");
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));

      state.running = false;
      state.done = true;
    });

  })();
} else {
  console.warn("SUPREMO ADMIN 2055 già caricato, skip.");
}
