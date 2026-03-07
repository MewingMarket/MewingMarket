/* =========================================================
   AUTH.JS — Stato login globale
========================================================= */

console.log("AUTH JS CARICATO");

// Stato globale
window.isLogged = false;
window.userEmail = null;

/* ---------------------------------------------------------
   Legge lo stato reale dell'utente
--------------------------------------------------------- */
function readAuthState() {
  try {
    const session = localStorage.getItem("session");
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");
    const utenteEmail = localStorage.getItem("utenteEmail");

    const logged = (session && email) || (token && utenteEmail);

    window.isLogged = !!logged;
    window.userEmail = logged ? (utenteEmail || email) : null;

  } catch (e) {
    window.isLogged = false;
    window.userEmail = null;
  }

  console.log("Auth state aggiornato:", {
    isLogged: window.isLogged,
    email: window.userEmail
  });

  dispatchAuthReady();
}

/* ---------------------------------------------------------
   Emette auth-ready quando il DOM è pronto
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
    localStorage.removeItem("session");
    localStorage.removeItem("email");
    localStorage.removeItem("token");
    localStorage.removeItem("utenteEmail");
  } catch (e) {}

  readAuthState();
}

/* ---------------------------------------------------------
   Inizializzazione
--------------------------------------------------------- */
readAuthState();

// Rileggi lo stato quando cambia localStorage
window.addEventListener("storage", readAuthState);

/* ---------------------------------------------------------
   IMPORTANTE: quando l'header è caricato, rileggi lo stato
--------------------------------------------------------- */
document.addEventListener("header-loaded", () => {
  readAuthState();
  dispatchAuthReady();
});
