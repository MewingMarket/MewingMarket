/* =========================================================
   LOADER HEADER / FOOTER / HEAD – MewingMarket
   Versione definitiva per app/public/ senza sottocartelle
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const page = window.location.pathname.split("/").pop();

  const shopPages = ["catalogo.html", "prodotto.html", "checkout.html"];

  /* ------------------------------
     1) HEAD GLOBALE
  ------------------------------ */
  try {
    const headRes = await fetch("head.html", { cache: "no-store" });
    const headHTML = await headRes.text();
    document.head.insertAdjacentHTML("beforeend", headHTML);
    document.dispatchEvent(new Event("head-loaded"));
  } catch (err) {
    console.error("Errore caricamento head.html:", err);
  }

  /* ------------------------------
     2) HEADER (shop o globale)
  ------------------------------ */
  const headerPlaceholder = document.getElementById("header-placeholder");

  if (headerPlaceholder) {
    const headerFile = shopPages.includes(page)
      ? "header-shop.html"
      : "header.html";

    try {
      const headerRes = await fetch(headerFile, { cache: "no-store" });
      const headerHTML = await headerRes.text();
      headerPlaceholder.innerHTML = headerHTML;
      document.dispatchEvent(new Event("header-loaded"));
    } catch (err) {
      console.error("Errore caricamento header:", err);
    }
  }

  /* ------------------------------
     3) FOOTER
  ------------------------------ */
  const footerPlaceholder = document.getElementById("footer-placeholder");

  if (footerPlaceholder) {
    try {
      const footerRes = await fetch("footer.html", { cache: "no-store" });
      const footerHTML = await footerRes.text();
      footerPlaceholder.innerHTML = footerHTML;
      document.dispatchEvent(new Event("footer-loaded"));
    } catch (err) {
      console.error("Errore caricamento footer:", err);
    }
  }

  /* ------------------------------
     4) SCRIPT GLOBALI
  ------------------------------ */
  loadScript("tracking.js");

  /* ------------------------------
     5) SCRIPT SOLO PAGINE SHOP
  ------------------------------ */
  if (shopPages.includes(page)) {
    loadScript("auth.js");
    loadScript("carrello.js");
    loadScript("header-shop.js");
  }
});

/* =========================================================
   FUNZIONE PER CARICARE SCRIPT
========================================================= */
function loadScript(src) {
  const s = document.createElement("script");
  s.src = src + "?v=" + Date.now();
  s.defer = true;
  document.body.appendChild(s);
}
