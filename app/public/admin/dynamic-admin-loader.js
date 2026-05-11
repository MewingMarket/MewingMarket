// =========================================================
// DYNAMIC ADMIN LOADER — SAFE MODE 2050
// Percorso reale: /app/public/admin/dynamic-admin-loader.js
// Anti 499/502 — stabile su Android/Chrome
// =========================================================

// =========================================================
// 🔒 MASTER LOCK 2052 — blocca re-run multipli dei loader
// =========================================================
if (window.__MASTER_LOADER_LOCK__) {
  console.warn("🔒 [MASTER-LOCK] dynamic-admin-loader.js bloccato → skip");
  return;
}
window.__MASTER_LOADER_LOCK__ = true;
// =========================================================

if (window.__DYNAMIC_ADMIN_LOADER_2050__) {
  console.warn("dynamic-admin-loader.js già caricato, skip.");
} else {
  window.__DYNAMIC_ADMIN_LOADER_2050__ = true;

  (function () {

    const VERSION = "2050";

    console.log("⚡ [DYNAMIC ADMIN 2050] Avvio dynamic-admin-loader (SAFE MODE)");

    // ============================================================
    // FUNZIONE PRINCIPALE
    // ============================================================
    function start() {

      console.log("➡️ [DYNAMIC ADMIN 2050] start() eseguito");

      // -------------------------------
      // 1) ANTI-CACHE (DYNAMIC)
      // -------------------------------
      try {
        if (!document.querySelector('meta[http-equiv="Cache-Control"]')) {

          console.log("🟧 [DYNAMIC ADMIN] Applico anti-cache");

          const m1 = document.createElement("meta");
          m1.httpEquiv = "Cache-Control";
          m1.content = "no-cache, no-store, must-revalidate";
          document.head.appendChild(m1);

          const m2 = document.createElement("meta");
          m2.httpEquiv = "Pragma";
          m2.content = "no-cache";
          document.head.appendChild(m2);

          const m3 = document.createElement("meta");
          m3.httpEquiv = "Expires";
          m3.content = "0";
          document.head.appendChild(m3);
        }
      } catch (e) {
        console.warn("❌ [DYNAMIC ADMIN] Errore anti-cache:", e.message);
      }

      // -------------------------------
      // 2) ANTI SERVICE WORKER (DYNAMIC)
      // -------------------------------
      try {
        console.log("🟧 [DYNAMIC ADMIN] Rimozione service worker e cache");

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
          });
        }

        if (window.caches) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }

      } catch (e) {
        console.warn("❌ [DYNAMIC ADMIN] Errore anti-service-worker:", e.message);
      }

      // -------------------------------
      // 3) DIAGNOSTICA ADMIN (DISATTIVATA)
      // -------------------------------
      console.log("🟧 [DYNAMIC ADMIN] diagnostica admin DISATTIVATA");
    }

    // ============================================================
    // ESECUZIONE STABILE (ANTI‑499)
    // ============================================================
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(start, 10); // micro‑delay anti race‑condition Android
      });
    } else {
      setTimeout(start, 10);
    }

  })();
}
