/* ============================
   LOADER HEADER + FOOTER
   Carica header diverso per pagine shop
============================ */

function isShopPage() {
  const shopPages = [
    "catalogo.html",
    "prodotto.html",
    "checkout.html"
  ];

  return shopPages.some(page => window.location.pathname.endsWith(page));
}

function loadHeader() {
  const headerFile = isShopPage() ? "header-shop.html" : "header.html";

  return fetch(headerFile)
    .then(r => r.text())
    .then(h => {
      document.getElementById("header-placeholder").innerHTML = h;
      document.dispatchEvent(new Event("header-loaded"));
    });
}

function loadFooter() {
  return fetch("footer.html")
    .then(r => r.text())
    .then(h => {
      document.getElementById("footer-placeholder").innerHTML = h;
      document.dispatchEvent(new Event("footer-loaded"));
    });
}

loadHeader().then(loadFooter);
