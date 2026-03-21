// =========================================================
// AUTH.JS — Versione FUNZIONANTE (2026)
// =========================================================

console.log("[AUTH] Caricato");

// ---------------------------------------------------------
// 1) Wrapper fetch: aggiunge automaticamente Authorization Bearer
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = localStorage.getItem("token"); // ⭐ PATCH

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
// 3) Carica sessione da localStorage
// ---------------------------------------------------------
function loadSession() {
  const session = localStorage.getItem("token") || ""; // ⭐ PATCH
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
// 4) Inizializzazione SENZA check-session
// ---------------------------------------------------------
async function initAuth() {
  loadSession();

  // Evento finale → sblocca header.js
  document.dispatchEvent(new Event("auth-ready"));
}

// ---------------------------------------------------------
// 5) Avvio
// ---------------------------------------------------------
initAuth();
