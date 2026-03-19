// =========================================================
// AUTH.JS — Versione DEFINITIVA (senza check-session)
// =========================================================

console.log("[AUTH] Caricato");

// ---------------------------------------------------------
// Wrapper fetch: aggiunge automaticamente x-token
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = localStorage.getItem("session");

    options.headers = options.headers || {};

    if (token) {
      options.headers["x-token"] = token;
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
  // Legge solo dal localStorage
  loadSession();

  // Nessun controllo remoto → nessun logout forzato
  // Nessun 404 → nessun errore
  // Nessun 401 → nessuna confusione

  // Evento finale
  document.dispatchEvent(new Event("auth-ready"));
}

// ---------------------------------------------------------
// Avvio
// ---------------------------------------------------------
initAuth();
