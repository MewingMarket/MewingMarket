/* =========================================================
   AUTH.JS — Gestione login/logout centralizzata (VERSIONE UNIVERSALE)
   Riconosce l'utente loggato indipendentemente dalla chiave salvata
========================================================= */

function isLogged() {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("email");

  const token = localStorage.getItem("token");
  const utenteEmail = localStorage.getItem("utenteEmail");

  // Utente loggato se esiste QUALSIASI combinazione valida
  if ((session && email) || (token && utenteEmail)) {
    return true;
  }

  return false;
}

function logout() {
  // Rimuove tutte le possibili chiavi senza rompere nulla
  localStorage.removeItem("session");
  localStorage.removeItem("email");
  localStorage.removeItem("token");
  localStorage.removeItem("utenteEmail");

  window.location.href = "index.html";
}
