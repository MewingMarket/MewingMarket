// =========================================================
// AUTH.JS — Persistenza Intelligente (2026.10)
// Stato di sessione + versione deploy
// =========================================================

console.log("[AUTH] Caricato");

const APP_VERSION = "2026.10";

// ---------------------------------------------------------
// 0) Gestione versione deploy (reset controllato, non a caso)
// ---------------------------------------------------------
(function () {
  const storedVersion = localStorage.getItem("appVersion");

  if (storedVersion !== APP_VERSION) {
    console.log("[AUTH] Nuova versione rilevata:", APP_VERSION, "(prima:", storedVersion, ")");
    // Reset CONSAPEVOLE: nessuna sessione attiva dopo il deploy
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
    localStorage.setItem("sessionState", "0");
    localStorage.setItem("appVersion", APP_VERSION);
  }
})();

// ---------------------------------------------------------
// 1) Wrapper fetch: Authorization Bearer automatico
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = localStorage.getItem("token");
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
window.sessionState = 0; // 0=nessuna, 1=loggato, 2=flusso sensibile

// ---------------------------------------------------------
// 3) Carica sessione da localStorage
// ---------------------------------------------------------
function loadSession() {
  const token = localStorage.getItem("token") || "";
  const email = localStorage.getItem("email") || "";
  const ruolo = localStorage.getItem("ruolo") || "";
  const state = parseInt(localStorage.getItem("sessionState") || "0", 10);

  window.isLogged = Boolean(token);
  window.userEmail = email;
  window.isAdmin = ruolo === "admin";
  window.sessionState = state;

  console.log("[AUTH] Stato persistente:", {
    token: token ? "(presente)" : "(vuoto)",
    email,
    ruolo,
    sessionState: window.sessionState,
    isLogged: window.isLogged,
    isAdmin: window.isAdmin
  });
}

// ---------------------------------------------------------
// 4) Inizializzazione
// ---------------------------------------------------------
function initAuth() {
  loadSession();
  document.dispatchEvent(new Event("auth-ready"));
}

initAuth();
