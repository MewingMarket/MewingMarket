// =========================================================
// ADMIN CRITICAL LOADER — Versione 2056 (JAVA-MODE SAFE)
// Percorso reale: /app/public/admin/admin-critical-loader.js
// Carica SOLO head-admin.html / header-admin.html / footer-admin.html
// Emissione evento: critical-core-loaded-admin (NON critical-ready)
// Nessun retry. Nessun fallback.
// =========================================================

if (window.__ADMIN_CRITICAL_LOADER_2056__) {
  console.warn("[ADMIN CRITICAL 2056] Già caricato → skip");
} else {
  window.__ADMIN_CRITICAL_LOADER_2056__ = true;

  (function () {

    const ADMIN_VERSION = "2056";

    console.log("⚡ [ADMIN CRITICAL 2056] Avvio critical loader ADMIN (JAVA-MODE SAFE)");

    // ============================================================
    // Utility: carica HTML in modo deterministico
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
              const temp = document.createElement("div");
              temp.innerHTML = html;

              [...temp.children].forEach(node => {
                if (node.tagName === "SCRIPT") {
                  const s = document.createElement("script");
                  s.text = node.text;
                  document.head.appendChild(s);
                } else {
                  document.head.appendChild(node);
                }
              });
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

    // ============================================================
    // MICRO-DELAY per evitare race con SUPREMO ADMIN
    // ============================================================
    function microDelay() {
      return new Promise(r => setTimeout(r, 20));
    }

    // ============================================================
    // SEQUENZA CRITICA — SOLO HTML
    // ============================================================
    (async () => {
      console.log("🟦 [ADMIN CRITICAL 2056] Sequenza minimal avviata");

      await loadHTML(
        `/admin/head-admin.html?v=${ADMIN_VERSION}`,
        "head-admin-placeholder",
        "head-admin.html"
      );

      await loadHTML(
        `/admin/header-admin.html?v=${ADMIN_VERSION}`,
        "header-admin-placeholder",
        "header-admin.html"
      );

      await loadHTML(
        `/admin/footer-admin.html?v=${ADMIN_VERSION}`,
        "footer-admin-placeholder",
        "footer-admin.html"
      );

      // Evita che header-admin.js parta prima del DOM
      await microDelay();

      console.log("🟩 [ADMIN CRITICAL 2056] HTML base ADMIN caricato (JAVA-MODE)");

      // ============================================================
      // EMISSIONE EVENTO INTERNO (NON critical-ready)
      // ============================================================
      window.__adminCriticalCoreLoaded = true;
      document.dispatchEvent(new Event("critical-core-loaded-admin"));

    })();

  })();
}
