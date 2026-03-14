console.log("AUTH JS CARICATO");

// Stato globale
window.isLogged = false;
window.userEmail = null;
window.userRole = null;
window.isAdmin = false;

/* ---------------------------------------------------------
   SALVATAGGIO DOPO LOGIN
--------------------------------------------------------- */
window.saveLoginState = function(token, email, ruolo) {
  console.log("[AUTH] Salvataggio stato login:", { token, email, ruolo });

  localStorage.setItem("session", token);
  localStorage.setItem("email", email);
  localStorage.setItem("ruolo", ruolo);

  readAuthState();
};

/* ---------------------------------------------------------
   Legge lo stato reale dell'utente (localStorage)
--------------------------------------------------------- */
function readAuthState() {
  try {
    const token = localStorage.getItem("session");
    const email = localStorage.getItem("email");
    const ruoloRaw = localStorage.getItem("ruolo") || "";

    console.log("[AUTH] Lettura stato:", { token, email, ruoloRaw });

    if (token && email) {
      window.isLogged = true;
      window.userEmail = email;

      const ruolo = ruoloRaw.trim().toLowerCase();
      window.userRole = ruolo;
      window.isAdmin = ruolo === "admin";

      console.log("[AUTH] Utente loggato come:", ruolo);

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
   Emette auth-ready
--------------------------------------------------------- */
function dispatchAuthReady() {
  const event = new CustomEvent("auth-ready");
  document.dispatchEvent(event);
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
function logout() {
  console.log("[AUTH] Logout → pulizia localStorage");
  localStorage.removeItem("session");
  localStorage.removeItem("email");
  localStorage.removeItem("ruolo");

  readAuthState();
  window.location.href = "index.html";
}

/* ---------------------------------------------------------
   Inizializzazione
--------------------------------------------------------- */
readAuthState();
window.addEventListener("storage", readAuthState);
document.addEventListener("header-loaded", readAuthState);
