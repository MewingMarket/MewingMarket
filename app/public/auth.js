/* ============================
   AUTH.JS - Stato login globale
============================ */

console.log("AUTH JS CARICATO");

// Stato globale iniziale
window.isLogged = false;   // 0 = visitatore
window.userEmail = null;

// Funzione che legge lo stato reale
function readAuthState() {
  try {
    const session = localStorage.getItem("session");
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");
    const utenteEmail = localStorage.getItem("utenteEmail");

    if ((session && email) || (token && utenteEmail)) {
      window.isLogged = true;   // 1 = utente loggato
      window.userEmail = utenteEmail || email;
    } else {
      window.isLogged = false;  // 0 = visitatore
      window.userEmail = null;
    }

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

/* -----------------------------------------
   EMETTE auth-ready SOLO QUANDO IL DOM È PRONTO
----------------------------------------- */
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

/* -----------------------------------------
   Esegui subito
----------------------------------------- */
readAuthState();

/* -----------------------------------------
   Rileggi lo stato ogni volta che cambia localStorage
----------------------------------------- */
window.addEventListener("storage", readAuthState);

/* -----------------------------------------
   LOGOUT
----------------------------------------- */
function logout() {
  try {
    localStorage.removeItem("session");
    localStorage.removeItem("email");
    localStorage.removeItem("token");
    localStorage.removeItem("utenteEmail");
  } catch (e) {}

  readAuthState();  // stato 2 = logout
  window.location.href = "index.html";
}
