// STRUCTURED DATA COMPLETO – MEWINGMARKET

(async function () {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  // Funzione per inserire JSON-LD
  function injectSchema(data) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // -------------------------------------------------------
  // 1) ORGANIZATION (sempre presente)
  // -------------------------------------------------------
  injectSchema({
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
  });

  // -------------------------------------------------------
  // 2) HOMEPAGE – WebSite
  // -------------------------------------------------------
  if (path === "/" || path === "/index.html") {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "MewingMarket",
      "url": "https://www.mewingmarket.it/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.mewingmarket.it/catalogo.html?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    });
  }

  // -------------------------------------------------------
  // 3) CATALOGO – CollectionPage
  // -------------------------------------------------------
  if (path === "/catalogo.html") {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Catalogo prodotti digitali – MewingMarket",
      "url": "https://www.mewingmarket.it/catalogo.html",
      "description": "Esplora il catalogo completo dei prodotti digitali MewingMarket."
    });
  }

  // -------------------------------------------------------
  // 4) FAQ – FAQPage
  // -------------------------------------------------------
  if (path === "/faq.html") {
    injectSchema({
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
    });
  }

  // -------------------------------------------------------
  // 5) BREADCRUMB – dinamico (catalogo + prodotto)
  // -------------------------------------------------------
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.mewingmarket.it/"
      }
    ]
  };

  if (path === "/catalogo.html") {
    breadcrumb.itemListElement.push({
      "@type": "ListItem",
      "position": 2,
      "name": "Catalogo",
      "item": "https://www.mewingmarket.it/catalogo.html"
    });
  }

  if (slug) {
    const res = await fetch("products.json", { cache: "no-store" });
    const products = await res.json();
    const p = products.find(pr => pr.slug === slug);

    if (p) {
      breadcrumb.itemListElement.push(
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Catalogo",
          "item": "https://www.mewingmarket.it/catalogo.html"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": p.titolo,
          "item": `https://www.mewingmarket.it/prodotto.html?slug=${p.slug}`
        }
      );
    }
  }

  injectSchema(breadcrumb);

  // -------------------------------------------------------
  // 6) PRODUCT – dinamico (con AggregateRating)
  // -------------------------------------------------------
  if (slug) {
    const res = await fetch("products.json", { cache: "no-store" });
    const products = await res.json();
    const p = products.find(pr => pr.slug === slug);
    if (!p) return;

    injectSchema({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": p.titolo,
      "description": p.descrizioneBreve || p.descrizioneLunga || "",
      "image": p.immagine,
      "sku": p.slug,
      "brand": {
        "@type": "Brand",
        "name": "MewingMarket"
      },
      "aggregateRating": p.rating_value ? {
        "@type": "AggregateRating",
        "ratingValue": p.rating_value,
        "reviewCount": p.review_count || p.rating_count
      } : undefined,
      "offers": {
        "@type": "Offer",
        "url": `https://www.mewingmarket.it/prodotto.html?slug=${p.slug}`,
        "priceCurrency": "EUR",
        "price": p.prezzo,
        "availability": "https://schema.org/InStock"
      }
    });
  }
})();
