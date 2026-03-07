/* =========================================================
   AUTH.JS — Stato login globale (versione definitiva)
========================================================= */

console.log("AUTH JS CARICATO");

// Stato globale
window.isLogged = false;
window.userEmail = null;

/* ---------------------------------------------------------
   Legge lo stato reale dell'utente (con fallback)
--------------------------------------------------------- */
function readAuthState() {
  try {
    const session = localStorage.getItem("session");
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");
    const utenteEmail = localStorage.getItem("utenteEmail");

    let logged = false;
    let user = null;

    /* PRIORITÀ 1 — token + utenteEmail (nuovo sistema) */
    if (token && utenteEmail) {
      logged = true;
      user = utenteEmail;
    }

    /* PRIORITÀ 2 — session + email (vecchio sistema) */
    else if (session && email) {
      logged = true;
      user = email;
    }

    /* FALLBACK — se manca una coppia valida → non loggato */
    else {
      logged = false;
      user = null;
    }

    window.isLogged = logged;
    window.userEmail = user;

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
   LOGOUT (blindato)
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
   Quando l'header è caricato, rileggi lo stato
--------------------------------------------------------- */
document.addEventListener("header-loaded", () => {
  readAuthState();
  dispatchAuthReady();
});
