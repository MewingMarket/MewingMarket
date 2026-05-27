// =========================================================
// DYNAMIC LOADER — Versione 2064 ULTRA-SAFE
// - Anti-CDN
// - Anti-cache HTTP
// - Anti-service worker
// - MAI bloccante
// =========================================================

console.log("⚡ [DYNAMIC 2064] Avvio dynamic-loader (ULTRA-SAFE)");

(function () {

  const V = "2064";

  // ============================================================
  // 1) ANTI-SERVICE WORKER (non bloccante)
  // ============================================================
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) {
          console.warn("🧹 [DYNAMIC 2064] Rimozione SW:", reg);
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("⚠️ [DYNAMIC 2064] Errore SW:", e);
  }

  // ============================================================
  // 2) ANTI-CACHE HTTP (non bloccante)
  // ============================================================
  try {
    if ("caches" in window) {
      caches.keys().then(keys => {
        keys.forEach(k => {
          console.warn("🧹 [DYNAMIC 2064] Rimozione cache:", k);
          caches.delete(k).catch(() => {});
        });
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("⚠️ [DYNAMIC 2064] Errore cache:", e);
  }

  // ============================================================
  // 3) ANTI-CDN (solo se riesce)
  // ============================================================
  try {
    const meta = document.createElement("meta");
    meta.httpEquiv = "Cache-Control";
    meta.content = "no-store, no-cache, must-revalidate, max-age=0";
    document.head.appendChild(meta);

    console.log("🟩 [DYNAMIC 2064] Anti-CDN applicato");
  } catch (e) {
    console.warn("⚠️ [DYNAMIC 2064] Anti-CDN non applicato:", e);
  }

  // ============================================================
  // 4) COMPLETATO (mai bloccante)
  // ============================================================
  console.log("🟩 [DYNAMIC 2064] Completato (ULTRA-SAFE)");

})();