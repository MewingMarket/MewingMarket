/* =========================================================
   STRUCTURED DATA – PATCH 2027.4
   Compatibile con Java‑mode + Promo + Catalogo 2057
========================================================= */

(function () {

  setTimeout(() => {

    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get("id");

    const clean = (t) =>
      typeof t === "string"
        ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
        : "";

    const safeURL = (url) =>
      typeof url === "string" && url.startsWith("http")
        ? url
        : "";

    const id = clean(rawId || "");

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

    /* ============================================================
       ORGANIZATION
    ============================================================ */
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

    /* ============================================================
       STATIC PAGES
    ============================================================ */
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

    if (path === "/catalogo.html") {
      injectSchema({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Catalogo prodotti digitali – MewingMarket",
        "url": "https://www.mewingmarket.it/catalogo.html",
        "description": "Esplora il catalogo completo dei prodotti digitali MewingMarket."
      });
    }

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

    /* ============================================================
       PRODUCT PAGE
    ============================================================ */
    if (!id) {
      injectSchema({
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
      });
      return;
    }

    /* ============================================================
       CARICA PRODOTTO (POST /api/prodotti-new)
    ============================================================ */
    fetch("/api/prodotti-new", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
      .then(r => r.json().catch(() => null))
      .then(json => {
        if (!json || !json.success || !Array.isArray(json.prodotti)) return;

        const p = json.prodotti.find(pr => String(pr.id) === String(id));
        if (!p) return;

        /* ============================================================
           BREADCRUMB
        ============================================================ */
        injectSchema({
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
              "name": "Catalogo",
              "item": "https://www.mewingmarket.it/catalogo.html"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": clean(p.titolo),
              "item": `https://www.mewingmarket.it/prodotto.html?id=${id}`
            }
          ]
        });

        /* ============================================================
           PRODUCT SCHEMA
        ============================================================ */
        const prezzoBase = Number(p.prezzo_cent || 0) / 100;
        const prezzoPromo = p.promo_attiva
          ? Number(p.prezzo_scontato_cent || 0) / 100
          : null;

        const productSchema = {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": clean(p.titolo),
          "description": clean(
            p.descrizioneEmail ||
            p.descrizioneBreve ||
            p.descrizioneLunga ||
            ""
          ),
          "image": safeURL(p.immagine_url || p.immagine),
          "sku": clean(String(p.id)),
          "brand": {
            "@type": "Brand",
            "name": "MewingMarket"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://www.mewingmarket.it/prodotto.html?id=${id}`,
            "priceCurrency": "EUR",
            "price": prezzoPromo !== null ? prezzoPromo : prezzoBase,
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
      })
      .catch(err => console.error("Errore structured-data:", err));

  }, 0);

})();
