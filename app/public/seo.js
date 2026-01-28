// SEO DINAMICO COMPLETO – MEWINGMARKET

(async function () {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  // Titolo e descrizione di default (homepage)
  let title = "MewingMarket – Prodotti digitali";
  let description = "Prodotti digitali chiari, utili e immediati. Guide, planner e strumenti per lavorare meglio ogni giorno.";
  let canonical = "https://www.mewingmarket.it/";

  // Mappa titoli per pagine statiche
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
    }
  };

  // Se è una pagina statica → aggiorna meta
  if (pages[path]) {
    title = pages[path].title;
    description = pages[path].description;
    canonical = "https://www.mewingmarket.it" + path;
  }

  // Se è una pagina prodotto → SEO dinamico
  if (slug) {
    const res = await fetch("products.json", { cache: "no-store" });
    const products = await res.json();
    const p = products.find(pr => pr.slug === slug);

    if (p) {
      title = p.titolo;
      description = p.descrizioneBreve || p.descrizioneLunga || "";
      canonical = `https://www.mewingmarket.it/prodotto.html?slug=${p.slug}`;

      // OpenGraph dinamici
      document.getElementById("og-title").setAttribute("content", title);
      document.getElementById("og-description").setAttribute("content", description);
      document.getElementById("og-url").setAttribute("content", canonical);
      document.getElementById("og-image").setAttribute("content", p.immagine);

      // Twitter dinamici
      document.getElementById("twitter-title").setAttribute("content", title);
      document.getElementById("twitter-description").setAttribute("content", description);
      document.getElementById("twitter-image").setAttribute("content", p.immagine);
    }
  }

  // Aggiorna meta comuni
  document.getElementById("dynamic-title").textContent = title;
  document.getElementById("dynamic-description").setAttribute("content", description);
  document.getElementById("dynamic-canonical").setAttribute("href", canonical);
})();
