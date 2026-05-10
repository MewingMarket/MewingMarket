// =========================================================
// LOADER UNIVERSALE ADMIN 2050 — AUTO DISCOVERY + STATIC MAP
// Percorso reale: /app/public/admin/loader-universale-admin.js
// =========================================================

if (window.__LOADER_UNIVERSALE_ADMIN__) {
  console.warn("loader-universale-admin.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_ADMIN__ = true;

  (function () {

    const VERSION = "2050";

    // ============================================================
    // CACHE GLOBALE JS + LOCK ESECUZIONE
    // ============================================================
    window.__SUPREMO_JS_CACHE__ = window.__SUPREMO_JS_CACHE__ || new Set();
    window.__UNIVERSALE_ADMIN_RUN_STATE__ = window.__UNIVERSALE_ADMIN_RUN_STATE__ || {
      running: false,
      done: false
    };

    console.log("⚡ [UNIVERSALE ADMIN 2050] Avvio loader universale ADMIN (AUTO DISCOVERY)");

    // ============================================================
    // NORMALIZZAZIONE
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

    // ============================================================
    // NOME BASE PAGINA (INTELLIGENTE)
    // ============================================================
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

    // ============================================================
    // FETCH JSON CON RETRY
    // ============================================================
    async function fetchWithRetry(url, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        } catch (e) {
          console.warn(`❌ [UNIVERSALE ADMIN] FAIL ${url} (tentativo ${attempt})`, e.message);
          await new Promise(r => setTimeout(r, attempt * 150));
        }
      }
      return null;
    }

    // ============================================================
    // STATIC MAP
    // ============================================================
    async function loadStaticMap() {
      const api = await fetchWithRetry("/api/js-list?v=" + VERSION);
      if (api) return api.admin || [];

      const static1 = await fetchWithRetry("/data/js-list.json?v=" + VERSION);
      if (static1) return static1.admin || [];

      const static2 = await fetchWithRetry("/data/js-list-mirror.json?v=" + VERSION);
      if (static2) return static2.admin || [];

      console.warn("🟧 [UNIVERSALE ADMIN] Nessuna static map disponibile");
      return [];
    }

    // ============================================================
    // CARICA SCRIPT (SAFE + CACHE)
    // ============================================================
    function loadScript(src) {
      const key = src;

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE ADMIN LOAD-SKIP già caricato]", key);
        return Promise.resolve({ ok: true, src: key, skipped: true });
      }

      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN LOAD-REQUEST]", key);

        const s = document.createElement("script");
        s.src = key + "?v=" + VERSION;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE ADMIN LOAD-OK]", key);
          window.__SUPREMO_JS_CACHE__.add(key);
          resolve({ ok: true, src: key });
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE ADMIN LOAD-FAIL]", key);
          resolve({ ok: false, src: key });
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // DEBUG IMPORT (con cache)
    // ============================================================
    async function debugImport(src) {
      const key = src + "::import";

      if (window.__SUPREMO_JS_CACHE__.has(key)) {
        console.log("⏭️ [UNIVERSALE ADMIN IMPORT-SKIP già importato]", src);
        return true;
      }

      try {
        await import(src + "?v=" + VERSION);
        console.log("📦 [UNIVERSALE ADMIN IMPORT-OK]", src);
        window.__SUPREMO_JS_CACHE__.add(key);
        return true;
      } catch (e) {
        console.warn("📦❌ [UNIVERSALE ADMIN IMPORT-FAIL]", src, e.message);
        return false;
      }
    }

    // ============================================================
    // AUTO DISCOVERY (ROOT + SOTTOCARTELLE ADMIN)
    // ============================================================
    function buildCandidatePaths(base) {
      const names = [
        `${base}.js`,
        `${base}-page.js`,
        `${base}-controller.js`,
        `${base}-module.js`,
        `${base}-extra.js`,
        `${base}-1.js`,
        `${base}-2.js`,
        `${base}-3.js`
      ];

      const dirs = [
        "/admin/",
        "/admin/js/",
        "/admin/scripts/",
        "/admin/modules/",
        "/admin/components/",
        "/admin/assets/js/"
      ];

      const out = [];

      dirs.forEach(dir => {
        names.forEach(n => out.push(dir + n));
      });

      return out;
    }

    // ============================================================
    // AVVIO (con LOCK)
    // ============================================================
    async function run() {

      const state = window.__UNIVERSALE_ADMIN_RUN_STATE__;

      if (state.done) {
        console.log("⏭️ [UNIVERSALE ADMIN] run() già completato, skip.");
        return;
      }
      if (state.running) {
        console.log("⏭️ [UNIVERSALE ADMIN] run() già in esecuzione, skip.");
        return;
      }

      state.running = true;

      console.log("🟦 [UNIVERSALE ADMIN] critical-core-ready ricevuto → avvio run()");

      const base = getPageBase();
      console.log("🔍 [UNIVERSALE ADMIN] Pagina normalizzata:", base);

      const staticMap = await loadStaticMap();
      const staticNormalized = staticMap.map(normalizeName);

      const candidates = buildCandidatePaths(base);

      console.log("🔍 [UNIVERSALE ADMIN] Candidati generati:", candidates);

      const loaded = [];
      const skipped = [];
      const failed = [];

      for (const full of candidates) {
        const name = full.split("/").pop();

        if (!staticNormalized.includes(normalizeName(name))) {
          skipped.push({ file: full, reason: "Non presente in static map" });
          continue;
        }

        let exists = false;
        try {
          const head = await fetch(full, { method: "HEAD" });
          exists = head.ok;
        } catch {}

        if (!exists) {
          skipped.push({ file: full, reason: "File non trovato" });
          continue;
        }

        const res = await loadScript(full);
        if (!res.ok) {
          failed.push({ file: full, reason: "Errore di caricamento" });
          continue;
        }

        const ok = await debugImport(full);
        if (!ok) {
          failed.push({ file: full, reason: "Errore in esecuzione" });
          continue;
        }

        loaded.push(full);
      }

      console.log("🟩 [UNIVERSALE ADMIN] JS CARICATI:", loaded);
      console.log("🟧 [UNIVERSALE ADMIN] JS SKIPPATI:", skipped);
      console.log("🟥 [UNIVERSALE ADMIN] JS FALLITI:", failed);

      state.running = false;
      state.done = true;

      document.dispatchEvent(new Event("page-js-loaded"));
    }

    document.addEventListener("critical-core-ready", run);

  })();
}
