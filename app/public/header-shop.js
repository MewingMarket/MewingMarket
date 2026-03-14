/* =========================================================
   HEADER-SHOP.JS — Gestione login/logout + carrello (DEFINITIVO)
========================================================= */

console.log("HEADER SHOP JS CARICATO");

/* ---------------------------------------------------------
   Riferimenti DOM (con fallback)
--------------------------------------------------------- */
const navLogin    = document.getElementById("nav-login");
const navRegister = document.getElementById("nav-register");
const navLogout   = document.getElementById("nav-logout");
const cartBadge   = document.getElementById("cart-badge");

/* ---------------------------------------------------------
   Aggiorna la UI in base allo stato login
--------------------------------------------------------- */
function updateHeaderUI() {
  console.log("HEADER: updateHeaderUI()", {
    isLogged: window.isLogged,
    email: window.userEmail
  });

  // Se i nodi non esistono, esci senza rompere nulla
  if (!navLogin || !navRegister || !navLogout) return;

  if (window.isLogged) {
    navLogin.style.display = "none";
    navRegister.style.display = "none";
    navLogout.style.display = "inline-block";
  } else {
    navLogin.style.display = "inline-block";
    navRegister.style.display = "inline-block";
    navLogout.style.display = "none";
  }
}

/* ---------------------------------------------------------
   Logout
--------------------------------------------------------- */
if (navLogout) {
  navLogout.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("HEADER: Logout cliccato");
    if (typeof logout === "function") {
      logout(); // funzione di auth.js
    } else {
      console.warn("HEADER: logout() non è definita");
    }
  });
}

/* ---------------------------------------------------------
   Aggiorna badge carrello (usa mewing_cart)
--------------------------------------------------------- */
function updateCartBadge() {
  if (!cartBadge) return;

  try {
    const cart = JSON.parse(localStorage.getItem("mewing_cart")) || [];
    const count = cart.reduce((sum, p) => sum + (p.qty || 1), 0);

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

// Quando auth.js ha finito → aggiorna header + badge
document.addEventListener("auth-ready", () => {
  console.log("HEADER: Evento auth-ready ricevuto");
  updateHeaderUI();
  updateCartBadge();
});

// Ascolta anche gli aggiornamenti del carrello
document.addEventListener("cart-updated", updateCartBadge);

// Storage multi-tab
window.addEventListener("storage", (e) => {
  if (e.key === "mewing_cart") updateCartBadge();
});
