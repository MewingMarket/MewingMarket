/* =========================================================
   LOADER HEADER + FOOTER + HEAD
   Gestione dinamica globale
   - Head (CSS, meta, favicon)
   - Header normale
   - Header shop (catalogo, prodotto, checkout)
   - Footer
========================================================= */

/* -----------------------------
   1) HEAD DINAMICO
----------------------------- */
function loadHead() {
  return fetch("head.html")
    .then(r => r.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      // Inserisce TUTTI i nodi del file head.html
      [...temp.children].forEach(node => document.head.appendChild(node));

      document.dispatchEvent(new Event("head-loaded"));
    })
    .catch(err => console.error("Errore caricamento head:", err));
}

/* -----------------------------
   2) Riconoscimento pagine shop
----------------------------- */
function isShopPage() {
  const path = window.location.pathname;

  return (
    path.includes("catalogo") ||
    path.includes("prodotto") ||
    path.includes("checkout")
  );
}

/* -----------------------------
   3) HEADER DINAMICO
----------------------------- */
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

/* -----------------------------
   4) FOOTER DINAMICO
----------------------------- */
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

/* -----------------------------
   5) SEQUENZA DI CARICAMENTO
----------------------------- */

loadHead()
  .then(loadHeader)
  .then(loadFooter);
