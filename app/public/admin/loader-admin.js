// =========================================================
// ADMIN CRITICAL LOADER — Versione 2055 (JAVA-MODE ULTRA MINIMAL)
// Percorso reale: /app/public/admin/admin-critical-loader-2055.js
// Carica SOLO head-admin.html / header-admin.html / footer-admin.html
// NON emette eventi. Nessun retry. Nessun fallback.
// =========================================================

if (window.__ADMIN_CRITICAL_LOADER_2055__) {
  console.warn("[ADMIN CRITICAL 2055] Già caricato → skip");
} else {
  window.__ADMIN_CRITICAL_LOADER_2055__ = true;

  (function () {

    const ADMIN_VERSION = "2055";

    console.log("⚡ [ADMIN CRITICAL 2055] Avvio critical loader ADMIN (JAVA-MODE)");

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
    // SEQUENZA CRITICA — SOLO HTML
    // ============================================================
    (async () => {
      console.log("🟦 [ADMIN CRITICAL 2055] Sequenza minimal avviata");

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

      console.log("🟩 [ADMIN CRITICAL 2055] HTML base ADMIN caricato (JAVA-MODE)");
      // Nessun evento. Nessun critical-core-ready.
      // SUPREMO ADMIN gestisce tutto.
    })();

  })();
}
