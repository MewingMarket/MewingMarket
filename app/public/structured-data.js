// STRUCTURED DATA COMPLETO – MEWINGMARKET (versione blindata)

(async function () {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const rawSlug = params.get("slug");

  /* =========================================================
     SANITIZZAZIONE
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (url) =>
    typeof url === "string" && url.startsWith("http")
      ? url
      : "";

  const slug = clean(rawSlug || "");

  function injectSchema(data) {
    try {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    } catch (err) {
      console.error("Errore injectSchema:", err);
    }
  }

  /* =========================================================
     1) ORGANIZATION (sempre presente)
  ========================================================== */
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

  /* =========================================================
     2) HOMEPAGE – WebSite
  ========================================================== */
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

  /* =========================================================
     3) CATALOGO – CollectionPage
  ========================================================== */
  if (path === "/catalogo.html") {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Catalogo prodotti digitali – MewingMarket",
      "url": "https://www.mewingmarket.it/catalogo.html",
      "description": "Esplora il catalogo completo dei prodotti digitali MewingMarket."
    });
  }

  /* =========================================================
     4) FAQ – FAQPage
  ========================================================== */
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

  /* =========================================================
     5) FETCH UNICO PRODUCTS.JSON (se serve)
  ========================================================== */
  let products = [];
  if (slug) {
    try {
      const res = await fetch("products.json", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) products = json;
      }
    } catch (err) {
      console.error("Errore caricamento products.json:", err);
    }
  }

  /* =========================================================
     6) BREADCRUMB – dinamico (catalogo + prodotto)
  ========================================================== */
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

  if (slug && products.length) {
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
          "name": clean(p.titolo),
          "item": `https://www.mewingmarket.it/prodotto.html?slug=${clean(p.slug)}`
        }
      );
    }
  }

  injectSchema(breadcrumb);

  /* =========================================================
     7) PRODUCT – dinamico (con AggregateRating)
  ========================================================== */
  if (slug && products.length) {
    const p = products.find(pr => pr.slug === slug);
    if (!p) return;

    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": clean(p.titolo),
      "description": clean(p.descrizioneBreve || p.descrizioneLunga || ""),
      "image": safeURL(p.immagine),
      "sku": clean(p.slug),
      "brand": {
        "@type": "Brand",
        "name": "MewingMarket"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://www.mewingmarket.it/prodotto.html?slug=${clean(p.slug)}`,
        "priceCurrency": "EUR",
        "price": Number(p.prezzo) || 0,
        "availability": "https://schema.org/InStock"
      }
    };

    if (p.rating_value) {
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": Number(p.rating_value),
        "reviewCount": Number(p.review_count || p.rating_count || 0)
      };
    }

    injectSchema(productSchema);
  }
})();
