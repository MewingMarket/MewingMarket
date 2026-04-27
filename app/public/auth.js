/* =========================================================
 * AUTH.JS — Persistenza SQL-SYNC (PATCH 2027.930)
 * FIX: Sincronizzazione chiavi Token e Sessione per SQL
 * ========================================================= */

console.log("🔐 [AUTH] Sistema di autenticazione avviato");

const APP_VERSION = "2026.10"; // Cambia questo per forzare il logout di tutti in caso di bug

// ---------------------------------------------------------
// Helper: registra evento utente (Sincronizzato con nuovo backend)
// ---------------------------------------------------------
async function logUserEvent(evento) {
  try {
    const email = localStorage.getItem("email") || "";
    if (!email) return;

    await fetch("/api/utenti/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        evento,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn("[AUTH] Log evento fallito:", err);
  }
}

// ---------------------------------------------------------
// 0) Gestione versione deploy (Reset se la versione cambia)
// ---------------------------------------------------------
(function () {
  const storedVersion = localStorage.getItem("appVersion");

  if (storedVersion !== APP_VERSION) {
    console.warn("[AUTH] Nuova versione: Reset sessione per compatibilità SQL.");

    localStorage.setItem("logoutReason", "deploy");

    const keysToRemove = ["token", "mewing_token", "email", "ruolo", "sessionState", "user"];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    window.isLogged = false;
    window.isAdmin = false;
    localStorage.setItem("appVersion", APP_VERSION);
    localStorage.setItem("sessionState", "0");
  }
})();

// ---------------------------------------------------------
// 2) Stato globale utente (Variabili in RAM)
// ---------------------------------------------------------
window.isLogged = false;
window.isAdmin = false;
window.userEmail = "";
window.userData = null;
window.sessionState = 0;

// ---------------------------------------------------------
// 3) Carica sessione da localStorage
// ---------------------------------------------------------
function loadSession() {
  const token = localStorage.getItem("mewing_token") || localStorage.getItem("token") || "";
  const email = localStorage.getItem("email") || "";
  const ruolo = localStorage.getItem("ruolo") || "";
  const userJson = localStorage.getItem("user");
  const state = parseInt(localStorage.getItem("sessionState") || "0", 10);

  window.isLogged = Boolean(token);
  window.userEmail = email;
  window.isAdmin = (ruolo === "admin" || ruolo === "1");
  window.sessionState = state;

  try {
    window.userData = userJson ? JSON.parse(userJson) : null;
  } catch {
    window.userData = null;
  }

  if (token && !localStorage.getItem("mewing_token")) {
    localStorage.setItem("mewing_token", token);
  }

  console.log("[AUTH] Stato attuale:", {
    loggato: window.isLogged,
    admin: window.isAdmin,
    email: window.userEmail
  });
}

// ---------------------------------------------------------
// 4) Inizializzazione
// ---------------------------------------------------------
function initAuth() {
  loadSession();

  const reason = localStorage.getItem("logoutReason");
  if (reason === "deploy") {
    logUserEvent("logout_automatico_deploy");
    localStorage.removeItem("logoutReason");
  }

  document.dispatchEvent(new Event("auth-ready"));

  if (window.isLogged) {
    document.dispatchEvent(new Event("user-logged-in"));
  }
}

initAuth();
