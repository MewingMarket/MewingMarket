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

// 2) HEADER (globale o shop)
const isShopPage =
  location.pathname.includes("catalogo") ||
  location.pathname.includes("prodotto") ||
  location.pathname.includes("checkout");

const headerFile = isShopPage ? "header-shop.html" : "header.html";

fetch(headerFile)
  .then(r => r.text())
  .then(html => {
    document.getElementById("header-placeholder").innerHTML = html;
    document.dispatchEvent(new Event("header-loaded"));
  });

// 3) FOOTER
fetch("footer.html")
  .then(r => r.text())
  .then(html => {
    document.getElementById("footer-placeholder").innerHTML = html;

    const year = document.getElementById("anno");
    if (year) year.textContent = new Date().getFullYear();

    document.dispatchEvent(new Event("footer-loaded"));
  });
