/* =========================================================
   AUTH.JS — Gestione login/logout centralizzata
   Usato da header, footer, dashboard, checkout, ecc.
========================================================= */

function isLogged() {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");
  return !!(session && email);
}

function logout() {
  localStorage.removeItem("session");
  localStorage.removeItem("utenteEmail");
  window.location.href = "index.html";
}
