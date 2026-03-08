/* =========================================================
   HEADER-SHOP.JS — Gestione login/logout + carrello
========================================================= */

console.log("HEADER SHOP JS CARICATO");

/* ---------------------------------------------------------
   Riferimenti DOM
--------------------------------------------------------- */
const navLogin = document.getElementById("nav-login");
const navRegister = document.getElementById("nav-register");
const navLogout = document.getElementById("nav-logout");
const cartBadge = document.getElementById("cart-badge");

/* ---------------------------------------------------------
   Aggiorna la UI in base allo stato login
--------------------------------------------------------- */
function updateHeaderUI() {
  if (window.isLogged) {
    // Utente loggato
    navLogin.style.display = "none";
    navRegister.style.display = "none";
    navLogout.style.display = "inline-block";
  } else {
    // Utente NON loggato
    navLogin.style.display = "inline-block";
    navRegister.style.display = "inline-block";
    navLogout.style.display = "none";
  }
}

/* ---------------------------------------------------------
   Logout
--------------------------------------------------------- */
navLogout.addEventListener("click", (e) => {
  e.preventDefault();
  logout(); // funzione di auth.js
});

/* ---------------------------------------------------------
   Aggiorna badge carrello
--------------------------------------------------------- */
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem("carrello")) || [];
    const count = cart.length;

    if (count > 0) {
      cartBadge.textContent = count;
      cartBadge.style.display = "inline-block";
    } else {
      cartBadge.style.display = "none";
    }
  } catch (e) {
    cartBadge.style.display = "none";
  }
}

/* ---------------------------------------------------------
   EVENTI
--------------------------------------------------------- */

// Quando auth.js ha finito → aggiorna header
document.addEventListener("auth-ready", () => {
  updateHeaderUI();
});

// Quando cambia il carrello
window.addEventListener("storage", (e) => {
  if (e.key === "carrello") updateCartBadge();
});

/* ---------------------------------------------------------
   Inizializzazione
--------------------------------------------------------- */
updateHeaderUI();
updateCartBadge();
