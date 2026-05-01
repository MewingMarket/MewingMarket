/* =========================================================
 * AUTH.JS — Persistenza SQL-SYNC (PATCH 2027.970)
 * FIX: Universal JSON + Robustezza totale
 * ========================================================= */

console.log("🔐 [AUTH] Sistema di autenticazione avviato");

const APP_VERSION = "2026.10";

/* =========================================================
   WRAPPER UNIVERSALE PER EVENTI UTENTE
========================================================= */
async function apiAuth(path, payload = {}) {
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("⚠️ [AUTH] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.warn("⚠️ [AUTH] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [AUTH] Evento non registrato:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   LOG EVENTO UTENTE (versione sicura)
========================================================= */
async function logUserEvent(evento) {
  const email = localStorage.getItem("email") || "";
  if (!email) return;

  await apiAuth("/api/utenti/evento", {
    email,
    evento,
    timestamp: new Date().toISOString()
  });
}

/* =========================================================
   RESET VERSIONE DEPLOY
========================================================= */
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

/* =========================================================
   STATO GLOBALE
========================================================= */
window.isLogged = false;
window.isAdmin = false;
window.userEmail = "";
window.userData = null;
window.sessionState = 0;

/* =========================================================
   CARICA SESSIONE
========================================================= */
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

/* =========================================================
   INIT AUTH
========================================================= */
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
