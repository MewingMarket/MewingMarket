// =========================================================
// HEADER.JS — Versione 2055 Deterministica
// Compatibile con critical/supremo/universale/dynamic
// =========================================================

console.log("[HEADER 2055] Caricato");

// =========================================================
// RESET HEADER (guest) — usato da deploy e logout
// =========================================================
function forceGuestHeader() {
  console.log("[HEADER] Reset forzato → guest");

  const ids = [
    "nav-catalogo",
    "nav-login",
    "nav-register",
    "nav-profilo",
    "nav-logout",
    "admin-trigger",
    "cart-wrapper"
  ];

  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

  if (!el["nav-catalogo"]) return;

  el["nav-catalogo"].style.display = "inline-block";
  el["nav-login"].style.display = "inline-block";
  el["nav-register"].style.display = "inline-block";
  el["nav-profilo"].style.display = "none";
  el["nav-logout"].style.display = "none";
  el["admin-trigger"].style.display = "none";
  el["cart-wrapper"].style.display = "none";
}

document.addEventListener("header-reset", forceGuestHeader);
document.addEventListener("auto-logout", forceGuestHeader);

// =========================================================
// AVVIO DETERMINISTICO (micro-wait 0ms)
// =========================================================
setTimeout(() => {

  console.log("[HEADER] Init…");

  const path = location.pathname.toLowerCase();

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

  if (!navCatalogo) {
    console.warn("[HEADER] Elementi non trovati");
    return;
  }

  // ============================================================
  // GLOBAL PAGES → solo logo
  // ============================================================
  if (isGlobal) {
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
  // GUEST
  // ============================================================
  if (!window.isLogged) {
    console.log("[HEADER] Guest");

    if (isHome) cartWrapper.style.display = "none";

    return;
  }

  // ============================================================
  // USER LOGGATO
  // ============================================================
  console.log("[HEADER] User loggato:", window.userEmail);

  navLogin.style.display = "none";
  navRegister.style.display = "none";
  navLogout.style.display = "inline-block";

  // Logout manuale (senza clear totale)
  navLogout.onclick = () => {
    localStorage.setItem("logoutReason", "manual");
    ["token", "mewing_token", "email", "ruolo", "user", "sessionState"]
      .forEach(k => localStorage.removeItem(k));
    window.location.href = "index.html";
  };

  if (isHome) {
    cartWrapper.style.display = "none";
    navProfilo.style.display = "inline-block";
  } else {
    navProfilo.style.display = "inline-block";
    cartWrapper.style.display = "flex";
  }

  // ============================================================
  // ADMIN
  // ============================================================
  if (window.isAdmin) {
    adminTrigger.style.display = "inline-block";
    navProfilo.style.display = "none";
    if (isHome) cartWrapper.style.display = "none";
  }

  // ============================================================
  // PAGINE UTENTE → nascondi carrello
  // ============================================================
  if (isUser) {
    cartWrapper.style.display = "none";
  }

  // ============================================================
  // BADGE CARRELLO (solo shop)
  // ============================================================
  function updateBadge() {
    if (!cartBadge) return;

    const cart = JSON.parse(localStorage.getItem("mewing_cart") || "[]");
    const count = cart.reduce((sum, p) => sum + (p.qty || 1), 0);

    if (isHome || isUser) {
      cartBadge.style.display = "none";
      return;
    }

    cartBadge.style.display = count > 0 ? "inline-block" : "none";
    if (count > 0) cartBadge.textContent = count;
  }

  updateBadge();
  document.addEventListener("cart-updated", updateBadge);

  console.log("[HEADER] Pronto.");

}, 0);
