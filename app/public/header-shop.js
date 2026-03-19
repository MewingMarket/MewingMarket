// =========================================================
// HEADER-SHOP.JS — Versione DEFINITIVA (2026)
// Gestisce header dinamico per homepage + shop
// =========================================================

console.log("[HEADER-SHOP] Caricato");

// Attende che header e auth siano pronti
Promise.all([
  new Promise(resolve => {
    if (document.getElementById("nav-login")) resolve();
    else document.addEventListener("header-loaded", resolve);
  }),
  new Promise(resolve => {
    if (window.isLogged !== undefined) resolve();
    else document.addEventListener("auth-ready", resolve);
  })
]).then(() => {
  console.log("[HEADER-SHOP] Inizializzazione…");

  const path = location.pathname.toLowerCase();
  const isHome =
    path === "/" ||
    path.endsWith("/index.html") ||
    path.endsWith("/index");

  // Elementi DOM
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navLogout = document.getElementById("nav-logout");
  const adminTrigger = document.getElementById("admin-trigger");
  const cartWrapper = document.getElementById("cart-wrapper");
  const cartBadge = document.getElementById("cart-badge");

  // Sicurezza
  if (!navLogin || !navRegister || !navLogout || !adminTrigger) {
    console.warn("[HEADER-SHOP] Elementi non trovati");
    return;
  }

  // Reset base
  navLogin.style.display = "inline-block";
  navRegister.style.display = "inline-block";
  navLogout.style.display = "none";
  adminTrigger.style.display = "none";

  // ============================================================
  // 1) GUEST
  // ============================================================
  if (!window.isLogged) {
    console.log("[HEADER-SHOP] Guest");

    if (isHome) {
      // Homepage guest → niente carrello
      cartWrapper.style.display = "none";
    } else {
      // Shop guest → carrello visibile
      cartWrapper.style.display = "flex";
    }

    return;
  }

  // ============================================================
  // 2) USER LOGGATO
  // ============================================================
  console.log("[HEADER-SHOP] User loggato:", window.userEmail);

  // Nascondi login/registrazione
  navLogin.style.display = "none";
  navRegister.style.display = "none";

  // Mostra logout
  navLogout.style.display = "inline-block";
  navLogout.onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };

  // Homepage → Profilo
  if (isHome) {
    cartWrapper.style.display = "none";

    navLogin.textContent = "Profilo";
    navLogin.href = "dashboard.html";
    navLogin.style.display = "inline-block";
  } else {
    // Shop → carrello visibile
    cartWrapper.style.display = "flex";
  }

  // ============================================================
  // 3) ADMIN
  // ============================================================
  if (window.isAdmin) {
    console.log("[HEADER-SHOP] Admin attivo");

    adminTrigger.style.display = "inline-block";

    if (isHome) {
      // Homepage admin → niente carrello
      cartWrapper.style.display = "none";
    }
  }

  // ============================================================
  // 4) BADGE CARRELLO (usa mewing_cart)
  // ============================================================
  function updateBadge() {
    if (!cartBadge) return;

    const cart = JSON.parse(localStorage.getItem("mewing_cart") || "[]");
    const count = cart.reduce((sum, p) => sum + (p.qty || 1), 0);

    if (isHome) {
      cartBadge.style.display = "none";
      return;
    }

    if (count > 0) {
      cartBadge.textContent = count;
      cartBadge.style.display = "inline-block";
    } else {
      cartBadge.style.display = "none";
    }
  }

  updateBadge();
  document.addEventListener("cart-updated", updateBadge);

  // Click su carrello → checkout
  document.addEventListener("click", (e) => {
    if (e.target.id === "cart-icon" || e.target.id === "cart-badge") {
      window.location.href = "checkout.html";
    }
  });

  console.log("[HEADER-SHOP] Pronto.");
});
