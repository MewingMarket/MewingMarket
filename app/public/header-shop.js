document.addEventListener("header-loaded", () => {

  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navDashboard = document.getElementById("nav-dashboard");
  const navLogout = document.getElementById("nav-logout");
  const cartWrapper = document.getElementById("cart-wrapper");

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

    navLogout.addEventListener("click", e => {
      e.preventDefault();
      logout();
      location.href = "index.html";
    });
  });

  cartWrapper.addEventListener("click", () => {
    location.href = "checkout.html";
  });

  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();
});
