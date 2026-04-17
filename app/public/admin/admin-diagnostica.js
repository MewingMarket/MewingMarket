// ==========================================
// ADMIN DIAGNOSTICA — MewingMarket
// Versione 20260412
// Non blocca nulla, non interferisce con loader-admin.
// Log non invasivi, solo diagnostica utile.
// ==========================================

(function () {

  console.log("🟦 [ADMIN-DIAG] Diagnostica admin avviata");

  // -------------------------------
  // 1) Verifica API
  // -------------------------------
  setTimeout(() => {
    if (window.api && typeof window.api === "object") {
      console.log("🟩 [ADMIN-DIAG] API OK");
    } else {
      console.warn("🟥 [ADMIN-DIAG] API NON disponibile");
    }
  }, 500);

  // -------------------------------
  // 2) Verifica auth
  // -------------------------------
  setTimeout(() => {
    if (window.isLogged === true) {
      console.log("🟩 [ADMIN-DIAG] Utente loggato");
    } else {
      console.warn("🟥 [ADMIN-DIAG] Utente NON loggato");
    }

    if (window.isAdmin === true) {
      console.log("🟩 [ADMIN-DIAG] Utente admin OK");
    } else {
      console.warn("🟥 [ADMIN-DIAG] Utente NON admin");
    }
  }, 700);

  // -------------------------------
  // 3) Verifica placeholder HTML
  // -------------------------------
  const placeholders = [
    "head-admin-placeholder",
    "header-admin-placeholder",
    "footer-admin-placeholder"
  ];

  placeholders.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      console.log(`🟩 [ADMIN-DIAG] Placeholder OK: ${id}`);
    } else {
      console.warn(`🟥 [ADMIN-DIAG] Placeholder MANCANTE: ${id}`);
    }
  });

  // -------------------------------
  // 4) Verifica Service Worker
  // -------------------------------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      if (regs.length === 0) {
        console.log("🟩 [ADMIN-DIAG] Nessun Service Worker attivo");
      } else {
        console.warn("🟥 [ADMIN-DIAG] Service Worker ANCORA attivi:", regs);
      }
    });
  }

})();
