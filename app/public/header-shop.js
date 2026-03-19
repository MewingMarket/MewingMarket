// =========================================================
// HEADER-SHOP.JS — Versione DEFINITIVA
// Sincronizzato con loader + auth-ready
// =========================================================

console.log("[HEADER-SHOP] Caricato");

// Attende che header e auth siano pronti
Promise.all([
  new Promise(resolve => {
    if (document.getElementById("header-placeholder")) {
      resolve();
    } else {
      document.addEventListener("header-loaded", resolve);
    }
  }),
  new Promise(resolve => {
    if (window.isLogged !== undefined) {
      resolve();
    } else {
      document.addEventListener("auth-ready", resolve);
    }
  })
]).then(() => {
  console.log("[HEADER-SHOP] Inizializzazione…");

  // Elementi
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navLogout = document.getElementById("nav-logout");
  const adminTrigger = document.getElementById("admin-trigger");
  const cartBadge = document.getElementById("cart-badge");

  // -------------------------------------------------------
  // LOGIN / LOGOUT
  // -------------------------------------------------------
  if (window.isLogged) {
    if (navLogin) navLogin.style.display = "none";
    if (navRegister) navRegister.style.display = "none";

    if (navLogout) {
      navLogout.style.display = "inline-block";
      navLogout.onclick = () => {
        localStorage.clear();
        window.location.href = "index.html";
      };
    }
  } else {
    if (navLogin) navLogin.style.display = "inline-block";
    if (navRegister) navRegister.style.display = "inline-block";
    if (navLogout) navLogout.style.display = "none";
  }

  // -------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------
  if (adminTrigger) {
    if (window.isAdmin) {
      adminTrigger.style.display = "inline-block";
    } else {
      adminTrigger.style.display = "none";
    }
  }

  // -------------------------------------------------------
  // BADGE CARRELLO
  // -------------------------------------------------------
  function updateBadge() {
    if (!cartBadge) return;

    const cart = JSON.parse(localStorage.getItem("carrello") || "[]");
    const count = cart.length;

    if (count > 0) {
      cartBadge.textContent = count;
      cartBadge.style.display = "inline-block";
    } else {
      cartBadge.style.display = "none";
    }
  }

  updateBadge();
  window.addEventListener("cart-updated", updateBadge);

  console.log("[HEADER-SHOP] Pronto.");
});
