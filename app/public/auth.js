/* =========================================================
   FILE: /public/auth.js
   Controllo login universale — Model A
   Versione definitiva: robusta, coerente, sicura
========================================================= */

/* -----------------------------------------
   UTENTE LOGGATO?
----------------------------------------- */
function isLogged() {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");
  return !!session && !!email;
}

/* -----------------------------------------
   RICHIEDI LOGIN (con redirect pulito)
----------------------------------------- */
function requireLogin(redirectTo = null) {
  if (isLogged()) return;

  // URL corrente completo (senza dominio)
  const current = redirectTo || window.location.pathname.split("/").pop();

  window.location.href = `login.html?redirect=${encodeURIComponent(current)}`;
}
