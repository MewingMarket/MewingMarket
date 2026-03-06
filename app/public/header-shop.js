// =========================================================
// HEADER SHOP – MewingMarket
// =========================================================

document.addEventListener("header-loaded", () => {

  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navDashboard = document.getElementById("nav-dashboard");
  const navLogout = document.getElementById("nav-logout");

  const cartWrapper = document.getElementById("cart-wrapper");
  const cartBadge = document.getElementById("cart-badge");

  if (!navLogin || !navRegister || !navDashboard || !navLogout || !cartWrapper) {
    console.warn("Header shop: elementi non trovati.");
    return;
  }

  // LOGIN READY
  document.addEventListener("auth-ready", () => {
    const logged = isLogged();

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

    // LOGOUT
    navLogout.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
      window.location.href = "index.html";
    });
  });

  // CLICK CARRELLO
  cartWrapper.addEventListener("click", () => {
    window.location.href = "checkout.html";
  });

  // BADGE CARRELLO
  if (typeof aggiornaBadgeCarrello === "function") {
    aggiornaBadgeCarrello();
  }
});
