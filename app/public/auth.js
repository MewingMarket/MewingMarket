// =========================================================
// AUTH.JS — Versione DEFINITIVA (wrapper fetch + auth-ready)
// =========================================================

console.log("[AUTH] Caricato");

// ---------------------------------------------------------
// Wrapper fetch: aggiunge automaticamente x-token
// ---------------------------------------------------------
(function () {
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = localStorage.getItem("session");

    options.headers = options.headers || {};

    // Aggiunge token solo se esiste
    if (token) {
      options.headers["x-token"] = token;
    }

    return originalFetch(url, options);
  };
})();

// ---------------------------------------------------------
// Stato globale utente
// ---------------------------------------------------------
window.isLogged = false;
window.isAdmin = false;
window.userEmail = "";

// ---------------------------------------------------------
// Funzione per leggere sessione
// ---------------------------------------------------------
function loadSession() {
  const session = localStorage.getItem("session") || "";
  const email = localStorage.getItem("email") || "";
  const ruolo = localStorage.getItem("ruolo") || "";

  window.userEmail = email;
  window.isLogged = Boolean(session && email);
  window.isAdmin = ruolo === "admin";

  console.log("[AUTH] Stato:", {
    session,
    email,
    ruolo,
    isLogged: window.isLogged,
    isAdmin: window.isAdmin
  });
}

// ---------------------------------------------------------
// Inizializzazione
// ---------------------------------------------------------
async function initAuth() {
  loadSession();

  // Se non loggato → auth-ready immediato
  if (!window.isLogged) {
    document.dispatchEvent(new Event("auth-ready"));
    return;
  }

  // Se loggato → verifica sessione con backend
  try {
    const res = await fetch("/api/utenti/check-session", {
      method: "GET"
    });

    const data = await res.json().catch(() => ({}));

    if (!data.success) {
      console.warn("[AUTH] Sessione non valida, logout forzato");
      localStorage.clear();
      window.isLogged = false;
      window.isAdmin = false;
      window.userEmail = "";
    } else {
      // Aggiorna ruolo se backend lo conferma
      if (data.ruolo) {
        localStorage.setItem("ruolo", data.ruolo);
        window.isAdmin = data.ruolo === "admin";
      }
    }
  } catch (err) {
    console.error("[AUTH] Errore verifica sessione:", err);
  }

  // Evento finale
  document.dispatchEvent(new Event("auth-ready"));
}

// ---------------------------------------------------------
// Avvio
// ---------------------------------------------------------
initAuth();
