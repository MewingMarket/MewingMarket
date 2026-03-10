/* =========================================================
   AUTH.JS — Stato login globale (versione definitiva)
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
    const ruolo = localStorage.getItem("ruolo");

    if (token && email) {
      window.isLogged = true;
      window.userEmail = email;
      window.userRole = ruolo || "user";
      window.isAdmin = ruolo === "admin";
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
   Emette auth-ready
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
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
function logout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
  } catch (e) {}

  readAuthState();
}

/* ---------------------------------------------------------
   Inizializzazione
--------------------------------------------------------- */
readAuthState();

// Aggiorna se cambia localStorage
window.addEventListener("storage", readAuthState);

// Aggiorna quando header è caricato
document.addEventListener("header-loaded", () => {
  readAuthState();
  dispatchAuthReady();
});
