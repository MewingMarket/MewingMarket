// =========================================================
// HEADER.JS — Versione DEFINITIVA (2026.40 + PATCH DEPLOY)
// Gestisce homepage + shop + dashboard + admin + pagine globali
// =========================================================

console.log("[HEADER] Caricato");

// =========================================================
// PATCH — Reset header dopo deploy
// =========================================================
function forceGuestHeader() {
  console.log("[HEADER] Reset forzato → stato guest");

  const navCatalogo = document.getElementById("nav-catalogo");
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navProfilo = document.getElementById("nav-profilo");
  const navLogout = document.getElementById("nav-logout");
  const adminTrigger = document.getElementById("admin-trigger");
  const cartWrapper = document.getElementById("cart-wrapper");

  if (!navCatalogo) return;

  navCatalogo.style.display = "inline-block";
  navLogin.style.display = "inline-block";
  navRegister.style.display = "inline-block";
  navProfilo.style.display = "none";
  navLogout.style.display = "none";
  adminTrigger.style.display = "none";
  cartWrapper.style.display = "none";
}

// Evento dal loader.js
document.addEventListener("header-reset", forceGuestHeader);

// Evento da auth.js (ridondanza sicura)
document.addEventListener("auto-logout", forceGuestHeader);

// =========================================================
// Attende che header e auth siano pronti
// =========================================================
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
  console.log("[HEADER] Inizializzazione…");

  const path = location.pathname.toLowerCase();

  // ============================================================
  // CLASSIFICAZIONE PAGINE
  // ============================================================
  const isHome =
    path === "/" ||
    path.endsWith("/index.html") ||
    path.endsWith("/index");

  const isShop =
    path.includes("catalogo") ||
    path.includes("prodotto") ||
    path.includes("checkout") ||
    path.includes("categories") ||
    path.includes("shop");

  const isUser =
    path.includes("dashboard") ||
    path.includes("ordini") ||
    path.includes("download") ||
    path.includes("profilo") ||
    path.includes("reset") ||
    path.includes("eliminaaccount") ||
    path.includes("thankyou");

  const isAdminPage =
    path.includes("/admin/") ||
    path.includes("dashboard-admin");

  const isGlobal = !isHome && !isShop && !isUser && !isAdminPage;

  // ============================================================
  // ELEMENTI DOM
  // ============================================================
  const navCatalogo = document.getElementById("nav-catalogo");
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navProfilo = document.getElementById("nav-profilo");
  const navLogout = document.getElementById("nav-logout");
  const adminTrigger = document.getElementById("admin-trigger");
  const cartWrapper = document.getElementById("cart-wrapper");
  const cartBadge = document.getElementById("cart-badge");

  if (!navCatalogo || !navLogin || !navRegister || !navProfilo || !navLogout || !adminTrigger) {
    console.warn("[HEADER] Elementi non trovati");
    return;
  }

  // ============================================================
  // 0) PAGINE GLOBALI → SOLO LOGO
  // ============================================================
  if (isGlobal) {
    console.log("[HEADER] Pagina globale → solo logo");

    navCatalogo.style.display = "none";
    navLogin.style.display = "none";
    navRegister.style.display = "none";
    navProfilo.style.display = "none";
    navLogout.style.display = "none";
    adminTrigger.style.display = "none";
    cartWrapper.style.display = "none";

    return;
  }

  // Reset base
  navCatalogo.style.display = "inline-block";
  navLogin.style.display = "inline-block";
  navRegister.style.display = "inline-block";
  navProfilo.style.display = "none";
  navLogout.style.display = "none";
  adminTrigger.style.display = "none";
  cartWrapper.style.display = "flex";

  // ============================================================
  // 1) GUEST
  // ============================================================
  if (!window.isLogged) {
    console.log("[HEADER] Guest");

    if (isHome) {
      cartWrapper.style.display = "none";
    }

    return;
  }

  // ============================================================
  // 2) USER LOGGATO
  // ============================================================
  console.log("[HEADER] User loggato:", window.userEmail);

  navLogin.style.display = "none";
  navRegister.style.display = "none";
  navLogout.style.display = "inline-block";

  // PATCH → logout manuale
  navLogout.onclick = () => {
    localStorage.setItem("logoutReason", "manual");
    localStorage.clear();
    window.location.href = "index.html";
  };

  // Homepage → Profilo
  if (isHome) {
    cartWrapper.style.display = "none";
    navProfilo.style.display = "inline-block";
  } else {
    navProfilo.style.display = "inline-block";
    cartWrapper.style.display = "flex";
  }

  // ============================================================
  // 3) ADMIN
  // ============================================================
  if (window.isAdmin) {
    console.log("[HEADER] Admin attivo");

    adminTrigger.style.display = "inline-block";

    if (isHome) {
      cartWrapper.style.display = "none";
    }

    navProfilo.style.display = "none";
  }

  // ============================================================
  // 4) PAGINE UTENTE → NASCONDI CARRELLO
  // ============================================================
  if (isUser) {
    console.log("[HEADER] Pagina utente → nascondo carrello");
    cartWrapper.style.display = "none";
  }

  // ============================================================
  // 5) BADGE CARRELLO (solo shop)
  // ============================================================
  function updateBadge() {
    if (!cartBadge) return;

    const cart = JSON.parse(localStorage.getItem("mewing_cart") || "[]");
    const count = cart.reduce((sum, p) => sum + (p.qty || 1), 0);

    if (isHome || isUser) {
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

  console.log("[HEADER] Pronto.");
});
