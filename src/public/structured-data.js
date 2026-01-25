// structured-data.js — JSON-LD automatico (Org + Breadcrumb + Product + FAQ)

document.addEventListener("DOMContentLoaded", async () => {

  const path = window.location.pathname.split("/").pop().replace(".html", "");

  const titles = {
    "index": "Home",
    "catalogo": "Catalogo",
    "chisiamo": "Chi siamo",
    "contatti": "Contatti",
    "faq": "FAQ",
    "dovesiamo": "Dove siamo",
    "privacy": "Privacy Policy",
    "cookie": "Cookie Policy",
    "resi": "Resi e rimborsi",
    "termini-e-condizioni": "Termini e condizioni",
    "iscrizione": "Iscrizione newsletter",
    "disiscriviti": "Annulla iscrizione",
    "prodotto": "Prodotto"
  };

  const pageName = titles[path] || "Pagina";

  // 1. ORGANIZZAZIONE
  const org = {
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

  // 2. BREADCRUMB
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.mewingmarket.it"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": pageName,
        "item": window.location.href
      }
    ]
  };

  // 3. PRODUCT (solo su prodotto.html)
  let productSchema = null;

  if (path === "prodotto") {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (slug) {
      const res = await fetch("products.json");
      const products = await res.json();
      const p = products.find(pr => pr.slug === slug);

      if (p) {
        productSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": p.titolo,
          "image": p.immagine,
          "description": p.descrizioneBreve || p.descrizioneLunga,
          "sku": p.slug,
          "brand": "MewingMarket",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "EUR",
            "price": p.prezzo,
            "availability": "https://schema.org/InStock",
            "url": window.location.href
          }
        };
      }
    }
  }

  // 4. FAQ (solo su faq.html)
  let faqSchema = null;

  if (path === "faq") {
    const res = await fetch("faq.json");
    const faq = await res.json();

    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faq.map(q => ({
        "@type": "Question",
        "name": q.domanda,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.risposta
        }
      }))
    };
  }

  // Inserimento JSON-LD
  function inject(data) {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  inject(org);
  inject(breadcrumb);
  inject(productSchema);
  inject(faqSchema);

});
