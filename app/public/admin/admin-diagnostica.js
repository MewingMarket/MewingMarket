// ==========================================
// ADMIN DIAGNOSTICA — MewingMarket
// Versione 2027.60 (compatibile universal-json + router universale)
// Non blocca nulla, non interferisce con loader-admin.
// Log non invasivi, solo diagnostica utile.
// ==========================================

(function () {

  console.log("🟦 [ADMIN-DIAG] Diagnostica admin avviata");

  // -------------------------------
  // 1) Verifica API globale
  // -------------------------------
  setTimeout(() => {
    if (window.api && typeof window.api === "object") {
      console.log("🟩 [ADMIN-DIAG] API globale OK");
    } else {
      console.warn("🟥 [ADMIN-DIAG] API globale NON disponibile");
    }
  }, 300);

  // -------------------------------
  // 2) Verifica autenticazione locale
  // -------------------------------
  setTimeout(() => {
    console.log(
      window.isLogged === true
        ? "🟩 [ADMIN-DIAG] Utente loggato"
        : "🟥 [ADMIN-DIAG] Utente NON loggato"
    );

    console.log(
      window.isAdmin === true
        ? "🟩 [ADMIN-DIAG] Utente admin OK"
        : "🟥 [ADMIN-DIAG] Utente NON admin"
    );
  }, 500);

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

  // -------------------------------
  // 5) Verifica API admin reale (/api/admin/me)
  // -------------------------------
  setTimeout(() => {
    fetch("/api/admin/me")
      .then(r => r.json())
      .then(j => {
        if (j && j.success && j.data) {
          console.log("🟩 [ADMIN-DIAG] /api/admin/me OK:", j.data.email);
        } else {
          console.warn("🟥 [ADMIN-DIAG] /api/admin/me NON valida:", j);
        }
      })
      .catch(err => console.warn("🟥 [ADMIN-DIAG] Errore /api/admin/me:", err));
  }, 800);

  // -------------------------------
  // 6) Verifica universal-json (/api/generico)
  // -------------------------------
  setTimeout(() => {
    fetch("/api/generico")
      .then(r => r.json())
      .then(j => {
        if (j && typeof j === "object") {
          console.log("🟩 [ADMIN-DIAG] universal-json OK");
        } else {
          console.warn("🟥 [ADMIN-DIAG] universal-json NON valido");
        }
      })
      .catch(err => console.warn("🟥 [ADMIN-DIAG] Errore universal-json:", err));
  }, 1000);

  // -------------------------------
  // 7) Verifica router universale
  // -------------------------------
  setTimeout(() => {
    fetch("/api/admin/getUtenti")
      .then(r => r.json())
      .then(j => {
        if (j && j.success !== undefined) {
          console.log("🟩 [ADMIN-DIAG] Router universale OK");
        } else {
          console.warn("🟥 [ADMIN-DIAG] Router universale NON risponde JSON");
        }
      })
      .catch(err => console.warn("🟥 [ADMIN-DIAG] Router universale errore:", err));
  }, 1200);

})();
