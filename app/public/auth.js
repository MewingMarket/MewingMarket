/* ============================
   AUTH.JS - Stato login globale
============================ */

console.log("AUTH JS CARICATO");

// Stato globale iniziale
window.isLogged = false;
window.userEmail = null;

// Funzione che legge lo stato reale
function readAuthState() {
  try {
    const session = localStorage.getItem("session");
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");
    const utenteEmail = localStorage.getItem("utenteEmail");

    if ((session && email) || (token && utenteEmail)) {
      window.isLogged = true;
      window.userEmail = utenteEmail || email;
    } else {
      window.isLogged = false;
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

  // Notifica gli altri script
  document.dispatchEvent(new CustomEvent("auth-ready"));
}

// Esegui subito
readAuthState();

// Rileggi lo stato ogni volta che cambia localStorage
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

  readAuthState();
  window.location.href = "index.html";
}
