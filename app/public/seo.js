// seo.js — SEO dinamico + nav attivo

document.addEventListener("DOMContentLoaded", () => {

  const file = window.location.pathname.split("/").pop().replace(".html", "");

  const titles = {
    "index": "MewingMarket – Prodotti digitali premium",
    "catalogo": "Catalogo prodotti digitali – MewingMarket",
    "chisiamo": "Chi siamo – MewingMarket",
    "contatti": "Contatti – MewingMarket",
    "faq": "FAQ – MewingMarket",
    "dovesiamo": "Dove siamo – MewingMarket",
    "privacy": "Privacy Policy – MewingMarket",
    "cookie": "Cookie Policy – MewingMarket",
    "resi": "Resi e rimborsi – MewingMarket",
    "termini-e-condizioni": "Termini e condizioni – MewingMarket",
    "iscrizione": "Iscriviti alla newsletter – MewingMarket",
    "disiscriviti": "Annulla iscrizione – MewingMarket",
    "prodotto": "Prodotto – MewingMarket"
  };

  const title = titles[file] || "MewingMarket – Prodotti digitali premium";

  // SEO dinamico
  document.getElementById("seo-title").innerText = title;
  document.getElementById("seo-description").setAttribute("content", title);

  document.getElementById("og-title").setAttribute("content", title);
  document.getElementById("og-description").setAttribute("content", title);
  document.getElementById("og-url").setAttribute("content", window.location.href);

  document.getElementById("tw-title").setAttribute("content", title);
  document.getElementById("tw-description").setAttribute("content", title);

  // Nav attivo
  document.querySelectorAll(".header-nav a").forEach(link => {
    if (link.getAttribute("href").includes(file)) {
      link.classList.add("active");
    }
  });

});
