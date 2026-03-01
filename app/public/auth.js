/* =========================================================
   AUTH.JS — Gestione login/logout centralizzata
   Usato da header, footer, dashboard, checkout, ecc.
========================================================= */

function isLogged() {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("email"); // PATCH: prima era "utenteEmail"
  return !!(session && email);
}

function logout() {
  localStorage.removeItem("session");
  localStorage.removeItem("email"); // PATCH: prima rimuoveva "utenteEmail"
  window.location.href = "index.html";
}
