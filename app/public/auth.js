/* =========================================================
   AUTH.JS — Stato login globale (VERSIONE DEFINITIVA)
========================================================= */

console.log("AUTH JS CARICATO");

// Stato globale
window.isLogged = false;
window.userEmail = null;
window.userRole = null;
window.isAdmin = false;

/* ---------------------------------------------------------
   Legge lo stato reale dell'utente (localStorage)
--------------------------------------------------------- */
function readAuthState() {
  try {
    // ⭐ CORREZIONE: il backend usa "session", NON "token"
    const token = localStorage.getItem("session");
    const email = localStorage.getItem("email");
    const ruoloRaw = localStorage.getItem("ruolo") || "";

    console.log("[AUTH] Lettura token:", token);
    console.log("[AUTH] Lettura email:", email);
    console.log("[AUTH] Lettura ruolo:", ruoloRaw);

    if (token && email) {
      window.isLogged = true;
      window.userEmail = email;

      // Normalizzazione ruolo
      const ruolo = String(ruoloRaw).trim().toLowerCase();
      let ruoloNorm = "user";

      if (ruolo.includes("admin")) ruoloNorm = "admin";
      else if (ruolo.includes("user")) ruoloNorm = "user";
      else ruoloNorm = "guest";

      window.userRole = ruoloNorm;
      window.isAdmin = ruoloNorm === "admin";

      console.log("[AUTH] Utente loggato come:", ruoloNorm);

    } else {
      console.log("[AUTH] Nessun token valido → utente NON loggato");
      window.isLogged = false;
      window.userEmail = null;
      window.userRole = null;
      window.isAdmin = false;
    }

  } catch (e) {
    console.log("[AUTH] Errore lettura stato:", e);
    window.isLogged = false;
    window.userEmail = null;
    window.userRole = null;
    window.isAdmin = false;
  }

  dispatchAuthReady();
}

/* ---------------------------------------------------------
   Emette auth-ready (garantito SEMPRE)
--------------------------------------------------------- */
function dispatchAuthReady() {
  const event = new CustomEvent("auth-ready");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      document.dispatchEvent(event);
    });
  } else {
    document.dispatchEvent(event);
  }

  setTimeout(() => document.dispatchEvent(event), 30);
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
function logout() {
  try {
    console.log("[AUTH] Logout → pulizia localStorage");
    localStorage.removeItem("session");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
  } catch (e) {}

  readAuthState();
  window.location.href = "index.html";
}

/* ---------------------------------------------------------
   Inizializzazione
--------------------------------------------------------- */
readAuthState();

// Multi-tab
window.addEventListener("storage", readAuthState);

// Quando header è caricato
document.addEventListener("header-loaded", () => {
  readAuthState();
  dispatchAuthReady();
});
