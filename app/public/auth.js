// =========================================================
// AUTH.JS — Versione DEFINITIVA (con Authorization Bearer)
// =========================================================

console.log("[AUTH] Caricato");

// ---------------------------------------------------------
// Wrapper fetch: aggiunge automaticamente Authorization Bearer
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = localStorage.getItem("session");

    options.headers = options.headers || {};

    if (token) {
      options.headers["Authorization"] = "Bearer " + token;
    }

    return originalFetch(url, options);
  };
})();

// ---------------------------------------------------------
// Stato globale utente
// ---------------------------------------------------------
window.isLogged = false;
window.isAdmin = false;
window.userEmail = "";

// ---------------------------------------------------------
// Carica sessione da localStorage
// ---------------------------------------------------------
function loadSession() {
  const session = localStorage.getItem("session") || "";
  const email = localStorage.getItem("email") || "";
  const ruolo = localStorage.getItem("ruolo") || "";

  window.userEmail = email;
  window.isLogged = Boolean(session && email);
  window.isAdmin = ruolo === "admin";

  console.log("[AUTH] Stato (solo localStorage):", {
    session,
    email,
    ruolo,
    isLogged: window.isLogged,
    isAdmin: window.isAdmin
  });
}

// ---------------------------------------------------------
// Inizializzazione SENZA check-session
// ---------------------------------------------------------
async function initAuth() {
  loadSession();

  // Evento finale
  document.dispatchEvent(new Event("auth-ready"));
}

// ---------------------------------------------------------
// Avvio
// ---------------------------------------------------------
initAuth();
