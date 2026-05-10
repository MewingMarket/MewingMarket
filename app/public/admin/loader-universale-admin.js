// =========================================================
// LOADER UNIVERSALE ADMIN 2050 — STATIC MAP MODE (ULTRA SAFE)
// Percorso reale: /app/public/admin/loader-universale-admin.js
// Usa solo la lista admin da /api/js-list
// =========================================================

if (window.__LOADER_UNIVERSALE_ADMIN__) {
  console.warn("loader-universale-admin.js già caricato, skip.");
} else {
  window.__LOADER_UNIVERSALE_ADMIN__ = true;

  (function () {

    const VERSION = "2050";

    console.log("⚡ [UNIVERSALE ADMIN 2050] Avvio loader universale ADMIN (STATIC MAP)");

    // ============================================================
    // NORMALIZZAZIONE NOMI (pagina + JS)
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
    // RETRY INTELLIGENTE — ULTRA FAST
    // ============================================================
    async function fetchWithRetry(url, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`➡️ [UNIVERSALE ADMIN] Fetch ${url} (tentativo ${attempt})`);
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        } catch (e) {
          console.warn(`❌ [UNIVERSALE ADMIN] FAIL ${url} (tentativo ${attempt})`, e.message);
          await new Promise(r => setTimeout(r, attempt * 150));
        }
      }
      console.error("🟥 [UNIVERSALE ADMIN] FALLITO:", url);
      return null;
    }

    // ============================================================
    // CARICA LISTA JS (STATIC MAP)
    // ============================================================
    async function loadJSON() {
      const api = await fetchWithRetry("/api/js-list?v=" + VERSION);
      if (api) return api;

      const static1 = await fetchWithRetry("/data/js-list.json?v=" + VERSION);
      if (static1) return static1;

      const static2 = await fetchWithRetry("/data/js-list-mirror.json?v=" + VERSION);
      if (static2) return static2;

      console.warn("🟧 [UNIVERSALE ADMIN] Nessuna lista JS disponibile");
      return { public: [], admin: [] };
    }

    // ============================================================
    // CARICA SCRIPT (SAFE, DEBUG) — PATCH: async=false
    // ============================================================
    function loadScript(src) {
      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN LOAD-REQUEST]", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false; // ← PATCH FONDAMENTALE
        s.fetchPriority = "high";

        s.onload = () => {
          console.log("✅ [UNIVERSALE ADMIN LOAD-OK]", src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE ADMIN LOAD-FAIL]", src);
          resolve(false);
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // IMPORT DEBUG
    // ============================================================
    async function debugImport(src) {
      try {
        await import(src + "?v=" + VERSION);
        console.log("📦 [UNIVERSALE ADMIN IMPORT-OK]", src);
      } catch (e) {
        console.warn("📦❌ [UNIVERSALE ADMIN IMPORT-FAIL]", src, e.message);
      }
    }

    // ============================================================
    // NOME BASE PAGINA (NORMALIZZATO)
    // ============================================================
    function getPageBase() {
      const raw = window.location.pathname.split("/").pop();
      return normalizeName(raw);
    }

    // ============================================================
    // AVVIO (STATIC MAP MODE)
    // ============================================================
    async function run() {
      console.log("🟦 [UNIVERSALE ADMIN 2050] critical-core-ready ricevuto → avvio run()");

      const list = await loadJSON();
      if (!list) {
        console.warn("🟧 [UNIVERSALE ADMIN] Lista JS non disponibile");
        document.dispatchEvent(new Event("page-js-loaded"));
        return;
      }

      const base = getPageBase();
      const pool = list.admin.map(js => normalizeName(js));

      console.log("🔍 [UNIVERSALE ADMIN] Pagina normalizzata:", base);
      console.log("🔍 [UNIVERSALE ADMIN] Lista normalizzata:", pool);

      const found = list.admin.filter(js => normalizeName(js) === base);

      if (found.length === 0) {
        console.warn("[UNIVERSALE ADMIN 2050] Nessun JS admin per", base);
        document.dispatchEvent(new Event("page-js-loaded"));
        return;
      }

      console.log("[UNIVERSALE ADMIN 2050] Carico JS pagina:", found);

      for (const js of found) {
        const full = "/admin/" + js;
        await loadScript(full);
        await debugImport(full);
      }

      console.log("🟩 [UNIVERSALE ADMIN 2050] page-js-loaded");
      document.dispatchEvent(new Event("page-js-loaded"));
    }

    document.addEventListener("critical-core-ready", run);

  })();
}
