console.log("AUTH JS CARICATO");

// Stato globale
window.isLogged = false;
window.userEmail = null;
window.userRole = null;
window.isAdmin = false;

/* ---------------------------------------------------------
   SALVATAGGIO DOPO LOGIN
   (token, email, ruolo arrivano dal backend SQL)
--------------------------------------------------------- */
window.saveLoginState = function(token, email, ruolo) {
  console.log("[AUTH] Salvataggio stato login:", { token, email, ruolo });

  // Salvataggio coerente con backend SQL
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

      // Compatibilità SQL: ruolo = "admin" oppure "user"
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
   Emette auth-ready (fondamentale per loader)
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

// Aggiorna stato se cambia localStorage (multi-tab)
window.addEventListener("storage", readAuthState);

// Aggiorna stato quando header è pronto
document.addEventListener("header-loaded", readAuthState);
