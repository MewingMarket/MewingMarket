// =========================================================
// LOADER HEADER + FOOTER + HEAD – MewingMarket
// =========================================================

// 1) HEAD
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

const path = location.pathname;

// Pagine shop (vendita)
const isShopPage =
  path.includes("catalogo") ||
  path.includes("prodotto") ||
  path.includes("checkout");

// Pagine utente (dashboard e impostazioni)
const isUserPage =
  path.includes("dashboard") ||
  path.includes("reset-password") ||
  path.includes("reset-email") ||
  path.includes("elimina-account");

// ---------------------------------------------------------
// 2B) CARICA CARRELLO.JS PRIMA DELL’HEADER (solo pagine shop)
// ---------------------------------------------------------
if (isShopPage) {
  const s = document.createElement("script");
  s.src = "carrello.js";
  document.head.appendChild(s);
}

// Header da caricare
let headerFile = "header.html"; // default globale

if (isShopPage) headerFile = "header-shop.html";
if (isUserPage) headerFile = "header-user.html";

fetch(headerFile)
  .then(r => r.text())
  .then(html => {
    document.getElementById("header-placeholder").innerHTML = html;
    document.dispatchEvent(new Event("header-loaded"));
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
