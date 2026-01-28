// STRUCTURED DATA DINAMICO MEWINGMARKET

(function () {
  const path = window.location.pathname.toLowerCase();

  // Mappa titoli per breadcrumb
  const titles = {
    "/": "MewingMarket – Prodotti digitali",
    "/catalogo.html": "Catalogo – MewingMarket",
    "/chisiamo.html": "Chi siamo – MewingMarket",
    "/faq.html": "FAQ – MewingMarket",
    "/contatti.html": "Contatti – MewingMarket",
    "/dovesiamo.html": "Dove siamo – MewingMarket",
    "/resi.html": "Resi e rimborsi – MewingMarket",
    "/privacy.html": "Privacy Policy – MewingMarket",
    "/cookie.html": "Cookie Policy – MewingMarket",
    "/termini-e-condizioni.html": "Termini e condizioni – MewingMarket",
    "/iscrizione.html": "Iscriviti alla newsletter – MewingMarket",
    "/disiscriviti.html": "Annulla iscrizione – MewingMarket"
  };

  const pageTitle = titles[path] || "MewingMarket – Prodotti digitali";
  const canonical = "https://www.mewingmarket.it" + (path === "/" ? "" : path);

  // ORGANIZATION SCHEMA
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MewingMarket",
    "url": "https://www.mewingmarket.it",
    "logo": "https://www.mewingmarket.it/logo.png",
    "sameAs": [
      "https://www.instagram.com/mewingmarket",
      "https://www.tiktok.com/@mewingmarket",
      "https://www.youtube.com/@mewingmarket2",
      "https://www.facebook.com/profile.php?id=61584779793628",
      "https://x.com/mewingm8",
      "https://www.threads.net/@mewingmarket",
      "https://www.linkedin.com/company/mewingmarket"
    ]
  };

  // BREADCRUMB SCHEMA
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.mewingmarket.it/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": pageTitle.replace(" – MewingMarket", ""),
        "item": canonical
      }
    ]
  };

  // FAQ SCHEMA (solo per FAQ.html)
  let faqSchema = null;

  if (path === "/faq.html") {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Come funziona MewingMarket?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MewingMarket offre prodotti digitali chiari, utili e immediati per migliorare il tuo lavoro quotidiano."
          }
        },
        {
          "@type": "Question",
          "name": "Come ricevo i prodotti?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dopo l'acquisto ricevi subito il link per scaricare il prodotto digitale."
          }
        }
      ]
    };
  }

  // Inserimento dinamico degli script
  function injectSchema(data) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  injectSchema(organization);
  injectSchema(breadcrumb);

  if (faqSchema) injectSchema(faqSchema);
})();
