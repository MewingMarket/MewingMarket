/* =========================================================
   HEADER SHOP — login/logout + badge
========================================================= */

document.addEventListener("header-loaded", () => {

  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navDashboard = document.getElementById("nav-dashboard");
  const navLogout = document.getElementById("nav-logout");
  const cartWrapper = document.getElementById("cart-wrapper");

  /* ---------------------------------------------------------
     LOGIN / LOGOUT / PROFILO
  --------------------------------------------------------- */
  function aggiornaHeaderAuth() {
    const logged = window.isLogged;

    if (logged) {
      navLogin.style.display = "none";
      navRegister.style.display = "none";
      navDashboard.style.display = "inline-block";
      navLogout.style.display = "inline-block";
    } else {
      navLogin.style.display = "inline-block";
      navRegister.style.display = "inline-block";
      navDashboard.style.display = "none";
      navLogout.style.display = "none";
    }
  }

  document.addEventListener("auth-ready", aggiornaHeaderAuth);

  navLogout.addEventListener("click", e => {
    e.preventDefault();
    logout();
    location.href = "index.html";
  });

  /* ---------------------------------------------------------
     CARRELLO
  --------------------------------------------------------- */
  cartWrapper.addEventListener("click", () => {
    location.href = "checkout.html";
  });

  document.addEventListener("cart-updated", aggiornaBadgeCarrello);

  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();
});
