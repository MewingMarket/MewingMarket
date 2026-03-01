/* =========================================================
   FILE: /public/auth.js
   Controllo login universale
========================================================= */

function isLogged() {
  return !!localStorage.getItem("session");
}

function requireLogin(redirectTo = null) {
  if (!isLogged()) {
    const url = redirectTo || window.location.pathname.replace("/", "");
    window.location.href = `login.html?redirect=${url}`;
  }
}
