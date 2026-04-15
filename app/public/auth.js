// =========================================================
// AUTH.JS — Persistenza Intelligente (2026.10 + PATCH DEPLOY)
// Stato di sessione + versione deploy + logoutReason
// PATCH EVENTI UTENTE: registra evento "logout"
// =========================================================

console.log("[AUTH] Caricato");

const APP_VERSION = "2026.10";

// ---------------------------------------------------------
// Helper: registra evento utente
// ---------------------------------------------------------
async function logUserEvent(evento) {
  try {
    const email = localStorage.getItem("email") || "";
    if (!email) return;

    await fetch("/api/utenti/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, evento })
    });
  } catch (err) {
    console.warn("Log evento fallito:", err);
  }
}

// ---------------------------------------------------------
// 0) Gestione versione deploy (reset controllato)
// ---------------------------------------------------------
(function () {
  const storedVersion = localStorage.getItem("appVersion");

  if (storedVersion !== APP_VERSION) {
    console.log("[AUTH] Nuova versione rilevata:", APP_VERSION, "(prima:", storedVersion, ")");

    // PATCH → logout automatico
    localStorage.setItem("logoutReason", "deploy");

    // Reset sessione (storage)
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
    localStorage.setItem("sessionState", "0");

    // ⭐ PATCH CRITICA — reset RAM (evita rilog automatico)
    window.isLogged = false;
    window.isAdmin = false;
    window.userEmail = "";

    // Aggiorna versione
    localStorage.setItem("appVersion", APP_VERSION);
  }
})();

// ---------------------------------------------------------
// 1) Wrapper fetch: Authorization Bearer automatico (PATCH 2026)
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (input, init) {
    try {
      const token = localStorage.getItem("token");

      // Clona init senza distruggere quello originale
      const newInit = init ? { ...init } : {};

      // Clona headers senza sovrascrivere quelli esistenti
      newInit.headers = init?.headers
        ? { ...init.headers }
        : {};

      // Aggiungi Authorization solo se esiste
      if (token) {
        newInit.headers["Authorization"] = "Bearer " + token;
      }

      return originalFetch(input, newInit);
    } catch (err) {
      console.error("[AUTH] Errore wrapper fetch:", err);
      return originalFetch(input, init);
    }
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
// 4) Inizializzazione + PATCH logout automatico
// ---------------------------------------------------------
function initAuth() {
  loadSession();

  // PATCH → rileva logout automatico da deploy
  const reason = localStorage.getItem("logoutReason");

  if (reason === "deploy") {
    console.log("[AUTH] Logout automatico per nuovo deploy");

    // ⭐ PATCH EVENTO: registra logout
    logUserEvent("logout");

    // Notifica globale
    document.dispatchEvent(new Event("auto-logout"));

    // Rimuovi flag
    localStorage.removeItem("logoutReason");
  }

  document.dispatchEvent(new Event("auth-ready"));
}

initAuth();
