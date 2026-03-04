/* =========================================================
   LOADER HEAD + HEADER + FOOTER
   Versione stabile per Render
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
      [...temp.children].forEach(node => document.head.appendChild(node));
    });
}

/* -----------------------------
   2) Riconoscimento pagine shop
----------------------------- */
function isShopPage() {
  const url = window.location.href;
  return (
    url.includes("catalogo") ||
    url.includes("prodotto") ||
    url.includes("checkout")
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
      if (!placeholder) return;

      placeholder.innerHTML = html;

      // RIESCI GLI SCRIPT INTERNI
      const scripts = placeholder.querySelectorAll("script");
      scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        if (oldScript.src) newScript.src = oldScript.src;
        else newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
      });
    });
}

/* -----------------------------
   4) FOOTER DINAMICO
----------------------------- */
function loadFooter() {
  return fetch("footer.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("footer-placeholder");
      if (placeholder) placeholder.innerHTML = html;
    });
}

/* -----------------------------
   5) SEQUENZA DI CARICAMENTO
----------------------------- */
loadHead()
  .then(loadHeader)
  .then(loadFooter);
