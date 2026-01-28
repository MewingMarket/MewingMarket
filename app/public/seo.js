// SEO DINAMICO MEWINGMARKET

(function () {
  const path = window.location.pathname.toLowerCase();

  // Titolo e descrizione di default (homepage)
  let title = "MewingMarket – Prodotti digitali";
  let description = "Prodotti digitali chiari, utili e immediati. Guide, planner e strumenti per lavorare meglio ogni giorno.";
  let canonical = "https://www.mewingmarket.it/";

  // Mappa titoli per pagina
  const pages = {
    "/catalogo.html": {
      title: "Catalogo – MewingMarket",
      description: "Esplora il catalogo completo dei prodotti digitali MewingMarket."
    },
    "/chisiamo.html": {
      title: "Chi siamo – MewingMarket",
      description: "Scopri la missione e la visione di MewingMarket."
    },
    "/faq.html": {
      title: "FAQ – MewingMarket",
      description: "Domande frequenti su prodotti, pagamenti e supporto."
    },
    "/contatti.html": {
      title: "Contatti – MewingMarket",
      description: "Contatta il supporto o il reparto vendite di MewingMarket."
    },
    "/dovesiamo.html": {
      title: "Dove siamo – MewingMarket",
      description: "Scopri dove si trova la sede di MewingMarket."
    },
    "/resi.html": {
      title: "Resi e rimborsi – MewingMarket",
      description: "Politica resi e rimborsi di MewingMarket."
    },
    "/privacy.html": {
      title: "Privacy Policy – MewingMarket",
      description: "Informativa sulla privacy di MewingMarket."
    },
    "/cookie.html": {
      title: "Cookie Policy – MewingMarket",
      description: "Informativa sui cookie utilizzati da MewingMarket."
    },
    "/termini-e-condizioni.html": {
      title: "Termini e condizioni – MewingMarket",
      description: "Termini e condizioni di utilizzo del sito MewingMarket."
    },
    "/iscrizione.html": {
      title: "Iscriviti alla newsletter – MewingMarket",
      description: "Iscriviti alla newsletter ufficiale di MewingMarket."
    },
    "/disiscriviti.html": {
      title: "Annulla iscrizione – MewingMarket",
      description: "Gestisci la tua iscrizione alla newsletter di MewingMarket."
    }
  };

  // Se la pagina è nella mappa, aggiorna titolo e descrizione
  if (pages[path]) {
    title = pages[path].title;
    description = pages[path].description;
    canonical = "https://www.mewingmarket.it" + path;
  }

  // Aggiorna titolo
  document.getElementById("dynamic-title").textContent = title;

  // Aggiorna description
  document.getElementById("dynamic-description").setAttribute("content", description);

  // Aggiorna canonical
  document.getElementById("dynamic-canonical").setAttribute("href", canonical);

  // Open Graph
  document.getElementById("og-title").setAttribute("content", title);
  document.getElementById("og-description").setAttribute("content", description);
  document.getElementById("og-url").setAttribute("content", canonical);

  // Twitter
  document.getElementById("twitter-title").setAttribute("content", title);
  document.getElementById("twitter-description").setAttribute("content", description);
})();
