// =========================================================
// ADMIN CRITICAL LOADER — Versione 2055 (ULTRA MINIMAL SAFE)
// Percorso reale: /app/public/admin/admin-critical-loader-2055.js
// Carica SOLO head-admin.html / header-admin.html / footer-admin.html / header-admin.js
// Emette SEMPRE critical-core-ready, senza retry, senza ping, senza import
// =========================================================

if (window.__ADMIN_CRITICAL_LOADER_2055__) {
  console.warn("[ADMIN CRITICAL 2055] Già caricato → skip");
} else {
  window.__ADMIN_CRITICAL_LOADER_2055__ = true;

  (function () {

    const ADMIN_VERSION = "2055";

    console.log("⚡ [ADMIN CRITICAL 2055] Avvio critical loader ADMIN (ULTRA MINIMAL)");

    // ============================================================
    // Utility base
    // ============================================================
    function loadHTML(url, placeholderId, label) {
      return new Promise(resolve => {
        fetch(url, { cache: "no-store" })
          .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
          })
          .then(html => {
            const ph = placeholderId ? document.getElementById(placeholderId) : null;
            if (ph) {
              ph.innerHTML = html;
            } else {
              // fallback: append in head se non c'è placeholder
              const temp = document.createElement("div");
              temp.innerHTML = html;
              [...temp.children].forEach(node => document.head.appendChild(node));
            }
            console.log(`✅ [ADMIN CRITICAL] ${label} OK da ${url}`);
            resolve(true);
          })
          .catch(e => {
            console.warn(`❌ [ADMIN CRITICAL] ${label} FAIL da ${url}`, e.message);
            resolve(false);
          });
      });
    }

    function loadScript(src, label) {
      return new Promise(resolve => {
        console.log("➡️ [ADMIN CRITICAL] LOAD-REQUEST", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${ADMIN_VERSION}`;
        s.async = false;
        s.fetchPriority = "high";

        s.onload = () => {
          console.log("✅ [ADMIN CRITICAL] LOAD-OK", label || src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [ADMIN CRITICAL] LOAD-FAIL", label || src);
          resolve(false);
        };

        document.head.appendChild(s);
      });
    }

    // ============================================================
    // Sequenza critica minimal
    // ============================================================
    (async () => {
      console.log("🟦 [ADMIN CRITICAL 2055] Sequenza minimal avviata");

      const okHead = await loadHTML(
        `/admin/head-admin.html?v=${ADMIN_VERSION}`,
        "head-admin-placeholder",
        "head-admin.html"
      );

      const okHeader = await loadHTML(
        `/admin/header-admin.html?v=${ADMIN_VERSION}`,
        "header-admin-placeholder",
        "header-admin.html"
      );

      const okFooter = await loadHTML(
        `/admin/footer-admin.html?v=${ADMIN_VERSION}`,
        "footer-admin-placeholder",
        "footer-admin.html"
      );

      const okHeaderJs = await loadScript("/admin/header-admin.js", "header-admin.js");

      if (!okHead || !okHeader || !okFooter || !okHeaderJs) {
        console.warn("🟧 [ADMIN CRITICAL 2055] Uno o più componenti non caricati correttamente (NON BLOCCA)");
      }

      console.log("🟩 [ADMIN CRITICAL 2055] critical-core-ready (ADMIN)");
      window.__adminCriticalCoreReady = true;
      document.dispatchEvent(new Event("critical-core-ready"));
    })();

  })();
}
