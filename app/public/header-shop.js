document.addEventListener("DOMContentLoaded", () => {
  // LOGIN / LOGOUT DINAMICO
  const logged = isLogged();

  const loginLink = document.getElementById("nav-login");
  const registerLink = document.getElementById("nav-register");
  const dashboardLink = document.getElementById("nav-dashboard");
  const logoutLink = document.getElementById("nav-logout");

  if (logged) {
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    dashboardLink.style.display = "inline-block";
    logoutLink.style.display = "inline-block";
  } else {
    loginLink.style.display = "inline-block";
    registerLink.style.display = "inline-block";
    dashboardLink.style.display = "none";
    logoutLink.style.display = "none";
  }

  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // CARRELLO
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
