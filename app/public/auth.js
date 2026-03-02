/* =========================================================
   AUTH.JS — Gestione login/logout centralizzata (UNIVERSALE)
========================================================= */

console.log("AUTH JS CARICATO");

function isLogged() {
  try {
    const session = localStorage.getItem("session");
    const email = localStorage.getItem("email");

    const token = localStorage.getItem("token");
    const utenteEmail = localStorage.getItem("utenteEmail");

    if ((session && email) || (token && utenteEmail)) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

function logout() {
  try {
    localStorage.removeItem("session");
    localStorage.removeItem("email");
    localStorage.removeItem("token");
    localStorage.removeItem("utenteEmail");
  } catch (e) {}

  window.location.href = "index.html";
}
