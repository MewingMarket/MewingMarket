// =========================================================
// AUTH.JS — Persistenza Intelligente (2026.10 + PATCH DEPLOY)
// Stato di sessione + versione deploy + logoutReason
// PATCH EVENTI UTENTE: registra evento "logout"
// PATCH 2027.300 — RIMOSSO OVERRIDE FETCH (causa blocchi login)
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
// ❌ PATCH 2027.300 — RIMOSSO OVERRIDE FETCH
// (era la causa del blocco login + blocco API)
// ---------------------------------------------------------
// Il wrapper fetch è stato completamente rimosso.
// Ora fetch rimane nativo e sicuro.
// apiFetch + fetchCritico gestiscono tutto il resto.

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

  const reason = localStorage.getItem("logoutReason");

  if (reason === "deploy") {
    console.log("[AUTH] Logout automatico per nuovo deploy");

    logUserEvent("logout");

    document.dispatchEvent(new Event("auto-logout"));

    localStorage.removeItem("logoutReason");
  }

  document.dispatchEvent(new Event("auth-ready"));
}

initAuth();
