/* ============================
   HEADER-SHOP.JS
============================ */

document.addEventListener("header-loaded", () => {
  console.log("HEADER: header-loaded ricevuto");

  const logged = window.isLogged;

  const loginLink = document.getElementById("nav-login");
  const registerLink = document.getElementById("nav-register");
  const dashboardLink = document.getElementById("nav-dashboard");
  const logoutLink = document.getElementById("nav-logout");

  if (logged) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (dashboardLink) dashboardLink.style.display = "inline-block";
    if (logoutLink) logoutLink.style.display = "inline-block";
  } else {
    if (loginLink) loginLink.style.display = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";
    if (dashboardLink) dashboardLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "none";
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  /* CARRELLO */
  const cartWrapper = document.createElement("div");
  cartWrapper.id = "cart-wrapper";

  const cartIcon = document.createElement("div");
  cartIcon.id = "cart-icon";
  cartIcon.innerHTML = "🛒";

  const cartBadge = document.createElement("div");
  cartBadge.id = "cart-badge";
  cartBadge.textContent = "0";

  cartWrapper.appendChild(cartIcon);
  cartWrapper.appendChild(cartBadge);

  cartWrapper.addEventListener("click", () => {
    window.location.href = "checkout.html";
  });

  const nav = document.querySelector("header nav");
  if (nav) nav.appendChild(cartWrapper);

  setTimeout(() => {
    if (typeof aggiornaBadgeCarrello === "function") {
      aggiornaBadgeCarrello();
    }
  }, 50);
});
