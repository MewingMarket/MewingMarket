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

      // /admin/diagnostica/123 → diagnostica
      if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
        return normalizeName(parts[parts.length - 2]);
      }

      // /admin/reset/email/XYZ → reset-email
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
    // CARICA SCRIPT
    // ============================================================
    function loadScript(src) {
      return new Promise(resolve => {
        console.log("➡️ [UNIVERSALE ADMIN LOAD-REQUEST]", src);

        const s = document.createElement("script");
        s.src = src + "?v=" + VERSION;
        s.async = false;

        s.onload = () => {
          console.log("✅ [UNIVERSALE ADMIN LOAD-OK]", src);
          resolve({ ok: true, src });
        };

        s.onerror = () => {
          console.warn("❌ [UNIVERSALE ADMIN LOAD-FAIL]", src);
          resolve({ ok: false, src });
        };

        document.body.appendChild(s);
      });
    }

    // ============================================================
    // DEBUG IMPORT
    // ============================================================
    async function debugImport(src) {
      try {
        await import(src + "?v=" + VERSION);
        console.log("📦 [UNIVERSALE ADMIN IMPORT-OK]", src);
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
    // AVVIO
    // ============================================================
    async function run() {
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

        // Skip se non è nella static map
        if (!staticNormalized.includes(normalizeName(name))) {
          skipped.push({ file: full, reason: "Non presente in static map" });
          continue;
        }

        // HEAD → esiste?
        let exists = false;
        try {
          const head = await fetch(full, { method: "HEAD" });
          exists = head.ok;
        } catch {}

        if (!exists) {
          skipped.push({ file: full, reason: "File non trovato" });
          continue;
        }

        // Carica
        const res = await loadScript(full);
        if (!res.ok) {
          failed.push({ file: full, reason: "Errore di caricamento" });
          continue;
        }

        // Import debug
        const ok = await debugImport(full);
        if (!ok) {
          failed.push({ file: full, reason: "Errore in esecuzione" });
          continue;
        }

        loaded.push(full);
      }

      // ============================================================
      // DEBUG FINALE
      // ============================================================
      console.log("🟩 [UNIVERSALE ADMIN] JS CARICATI:", loaded);
      console.log("🟧 [UNIVERSALE ADMIN] JS SKIPPATI:", skipped);
      console.log("🟥 [UNIVERSALE ADMIN] JS FALLITI:", failed);

      document.dispatchEvent(new Event("page-js-loaded"));
    }

    document.addEventListener("critical-core-ready", run);

  })();
}
