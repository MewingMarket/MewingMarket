// =========================================================
// AUTH.JS — Persistenza Totale (2026)
// Rimani loggato finché non clicchi Logout
// Token sempre inviato correttamente
// =========================================================

console.log("[AUTH] Caricato");

// ---------------------------------------------------------
// 1) Wrapper fetch: aggiunge automaticamente Authorization Bearer
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = localStorage.getItem("token"); // ⭐ token corretto

    options.headers = options.headers || {};

    if (token) {
      options.headers["Authorization"] = "Bearer " + token;
    }

    return originalFetch(url, options);
  };
})();

// ---------------------------------------------------------
// 2) Stato globale utente
// ---------------------------------------------------------
window.isLogged = false;
window.isAdmin = false;
window.userEmail = "";

// ---------------------------------------------------------
// 3) Carica sessione da localStorage (persistenza totale)
// ---------------------------------------------------------
function loadSession() {
  const token = localStorage.getItem("token") || "";   // ⭐ token vero
  const email = localStorage.getItem("email") || "";
  const ruolo = localStorage.getItem("ruolo") || "";

  // Se c’è token → sei loggato
  window.isLogged = Boolean(token);
  window.userEmail = email;
  window.isAdmin = ruolo === "admin";

  console.log("[AUTH] Stato persistente:", {
    token,
    email,
    ruolo,
    isLogged: window.isLogged,
    isAdmin: window.isAdmin
  });
}

// ---------------------------------------------------------
// 4) Inizializzazione (senza check remoto)
// ---------------------------------------------------------
function initAuth() {
  loadSession();

  // Sblocca header.js
  document.dispatchEvent(new Event("auth-ready"));
}

// ---------------------------------------------------------
// 5) Avvio
// ---------------------------------------------------------
initAuth();
