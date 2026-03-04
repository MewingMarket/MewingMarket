/* =========================================================
   LOADER HEADER + FOOTER
   Header globale vs Header shop
   (catalogo, prodotto, checkout)
========================================================= */

function isShopPage() {
  const path = window.location.pathname;

  // SOLO queste tre pagine devono avere header-shop
  return (
    path.includes("catalogo") ||
    path.includes("prodotto") ||
    path.includes("checkout")
  );
}

function loadHeader() {
  const headerFile = isShopPage() ? "header-shop.html" : "header.html";

  return fetch(headerFile)
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("header-placeholder");
      if (placeholder) {
        placeholder.innerHTML = html;
      }
      document.dispatchEvent(new Event("header-loaded"));
    })
    .catch(err => console.error("Errore caricamento header:", err));
}

function loadFooter() {
  return fetch("footer.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("footer-placeholder");
      if (placeholder) {
        placeholder.innerHTML = html;
      }
      document.dispatchEvent(new Event("footer-loaded"));
    })
    .catch(err => console.error("Errore caricamento footer:", err));
}

// Carica prima header, poi footer
loadHeader().then(loadFooter);
