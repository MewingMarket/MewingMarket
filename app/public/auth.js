/* =========================================================
   AUTH.JS — Stato login globale (VERSIONE PATCHIATA)
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
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const ruoloRaw = localStorage.getItem("ruolo") || "";

    if (token && email) {
      window.isLogged = true;
      window.userEmail = email;

      // Normalizzazione ruolo
      const ruolo = String(ruoloRaw).trim().toLowerCase();
      let ruoloNorm = "user";

      if (ruolo.includes("admin") || ruolo.includes("amministrator")) {
        ruoloNorm = "admin";
      } else if (ruolo.includes("user") || ruolo.includes("utente")) {
        ruoloNorm = "user";
      } else if (ruolo.includes("guest") || ruolo.includes("ospite")) {
        ruoloNorm = "guest";
      }

      window.userRole = ruoloNorm;
      window.isAdmin = ruoloNorm === "admin";

    } else {
      window.isLogged = false;
      window.userEmail = null;
      window.userRole = null;
      window.isAdmin = false;
    }

  } catch (e) {
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

  // Se il DOM non è pronto, aspetta
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      document.dispatchEvent(event);
    });
  } else {
    document.dispatchEvent(event);
  }

  // ⭐ PATCH: doppio dispatch per garantire che header-shop.js lo riceva
  setTimeout(() => document.dispatchEvent(event), 30);
}

/* ---------------------------------------------------------
   LOGOUT (PATCH: redirect obbligatorio)
--------------------------------------------------------- */
function logout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
  } catch (e) {}

  readAuthState();

  // ⭐ PATCH: ricarica la pagina per aggiornare header e stato
  window.location.href = "index.html";
}

/* ---------------------------------------------------------
   Inizializzazione
--------------------------------------------------------- */
readAuthState();

// Aggiorna se cambia localStorage (multi-tab)
window.addEventListener("storage", readAuthState);

// Aggiorna quando header è caricato
document.addEventListener("header-loaded", () => {
  readAuthState();
  dispatchAuthReady();
});
