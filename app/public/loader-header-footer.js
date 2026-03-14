// =========================================================
// LOADER HEADER + FOOTER + HEAD – MewingMarket (VERSIONE FINALE)
// =========================================================

const path = location.pathname;

// ---------------------------------------------------------
// 0) CARICA AUTH SOLO SE SERVE
// ---------------------------------------------------------
const needsAuth =
  path.includes("dashboard") ||
  path.includes("reset-password") ||
  path.includes("reset-email") ||
  path.includes("elimina-account") ||
  path.includes("catalogo") ||
  path.includes("prodotto") ||
  path.includes("checkout");

if (needsAuth) {
  const authScript = document.createElement("script");
  authScript.src = "auth.js";
  document.head.appendChild(authScript);
}

// ---------------------------------------------------------
// 1) HEAD
// ---------------------------------------------------------
fetch("head.html")
  .then(r => r.text())
  .then(html => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    [...temp.children].forEach(node => document.head.appendChild(node));
    document.dispatchEvent(new Event("head-loaded"));
  });

// ---------------------------------------------------------
// 2) DECISIONE HEADER
// ---------------------------------------------------------

const isShopPage =
  path.includes("catalogo") ||
  path.includes("prodotto") ||
  path.includes("checkout");

const isUserPage =
  path.includes("dashboard") ||
  path.includes("reset-password") ||
  path.includes("reset-email") ||
  path.includes("elimina-account");

// Header da caricare
let headerFile = "header.html"; // default

if (isShopPage) headerFile = "header-shop.html";
// header-user ELIMINATO

// ---------------------------------------------------------
// 2B) CARICA CARRELLO SOLO NELLE PAGINE SHOP
// ---------------------------------------------------------
if (isShopPage) {
  const s = document.createElement("script");
  s.src = "carrello.js";
  document.head.appendChild(s);
}

// ---------------------------------------------------------
// 2C) CARICA HEADER
// ---------------------------------------------------------
fetch(headerFile)
  .then(r => r.text())
  .then(html => {
    document.getElementById("header-placeholder").innerHTML = html;
    document.dispatchEvent(new Event("header-loaded"));

    if (headerFile === "header-shop.html") {
      const s = document.createElement("script");
      s.src = "header-shop.js";
      document.body.appendChild(s);
    }
  });

// ---------------------------------------------------------
// 3) FOOTER
// ---------------------------------------------------------
fetch("footer.html")
  .then(r => r.text())
  .then(html => {
    document.getElementById("footer-placeholder").innerHTML = html;
    const year = document.getElementById("anno");
    if (year) year.textContent = new Date().getFullYear();
    document.dispatchEvent(new Event("footer-loaded"));
  });

// ---------------------------------------------------------
// 4) POPUP POST-LOGIN
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("showLoginChoice") === "1") {
    localStorage.removeItem("showLoginChoice");
    // popup code unchanged
  }
});

// ---------------------------------------------------------
// 5) CARICA LOADER ADMIN SOLO SE ADMIN
// ---------------------------------------------------------
document.addEventListener("auth-ready", () => {
  if (window.isAdmin) {
    const s = document.createElement("script");
    s.src = "loader-admin.js";
    document.body.appendChild(s);
  }
});
