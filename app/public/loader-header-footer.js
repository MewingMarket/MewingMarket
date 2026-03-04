/* =========================================================
   LOADER HEAD + HEADER + FOOTER
   Versione stabile con funzioni separate
========================================================= */

/* -----------------------------
   1) HEAD DINAMICO
----------------------------- */
function loadHead() {
  return fetch("/head.html")
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
   3) HEADER GLOBALE
----------------------------- */
function loadGlobalHeader() {
  return fetch("/header.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("header-placeholder");
      if (!placeholder) return;
      placeholder.innerHTML = html;
    });
}

/* -----------------------------
   4) HEADER SHOP
----------------------------- */
function loadShopHeader() {
  return fetch("/header-shop.html")
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
   5) ROUTER HEADER
----------------------------- */
function loadHeader() {
  if (isShopPage()) {
    return loadShopHeader();
  } else {
    return loadGlobalHeader();
  }
}

/* -----------------------------
   6) FOOTER
----------------------------- */
function loadFooter() {
  return fetch("/footer.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("footer-placeholder");
      if (placeholder) placeholder.innerHTML = html;
    });
}

/* -----------------------------
   7) SEQUENZA DI CARICAMENTO
----------------------------- */
loadHead()
  .then(loadHeader)
  .then(loadFooter);
