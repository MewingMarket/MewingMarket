// SEO DINAMICO COMPLETO – MEWINGMARKET (versione blindata)

(async function () {
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

  /* =========================================================
     LETTURA PATH E PARAMETRI
  ========================================================== */
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const slug = clean(params.get("slug") || "");

  /* =========================================================
     META DI DEFAULT
  ========================================================== */
  let title = "MewingMarket – Prodotti digitali";
  let description =
    "Prodotti digitali chiari, utili e immediati. Guide, planner e strumenti per lavorare meglio ogni giorno.";
  let canonical = "https://www.mewingmarket.it/";

  /* =========================================================
     PAGINE STATICHE
  ========================================================== */
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

  if (pages[path]) {
    title = pages[path].title;
    description = pages[path].description;
    canonical = "https://www.mewingmarket.it" + path;
  }

  /* =========================================================
     PAGINA PRODOTTO (blindata)
  ========================================================== */
  let productData = null;

  if (slug) {
    try {
      const res = await fetch("products.json", { cache: "no-store" });
      if (res.ok) {
        const products = await res.json();
        if (Array.isArray(products)) {
          productData = products.find((pr) => pr.slug === slug);
        }
      }
    } catch (err) {
      console.error("Errore caricamento products.json:", err);
    }

    if (productData) {
      const p = productData;

      title = clean(p.titolo);
      description = clean(p.descrizioneBreve || p.descrizioneLunga || "");
      canonical = `https://www.mewingmarket.it/prodotto.html?slug=${clean(p.slug)}`;

      const img = safeURL(p.immagine);

      /* ----------------------------
         OPEN GRAPH (blindato)
      ----------------------------- */
      const ogTitle = document.getElementById("og-title");
      const ogDesc = document.getElementById("og-description");
      const ogUrl = document.getElementById("og-url");
      const ogImg = document.getElementById("og-image");

      if (ogTitle) ogTitle.setAttribute("content", title);
      if (ogDesc) ogDesc.setAttribute("content", description);
      if (ogUrl) ogUrl.setAttribute("content", canonical);
      if (ogImg && img) ogImg.setAttribute("content", img);

      /* ----------------------------
         TWITTER (blindato)
      ----------------------------- */
      const twTitle = document.getElementById("twitter-title");
      const twDesc = document.getElementById("twitter-description");
      const twImg = document.getElementById("twitter-image");

      if (twTitle) twTitle.setAttribute("content", title);
      if (twDesc) twDesc.setAttribute("content", description);
      if (twImg && img) twImg.setAttribute("content", img);
    }
  }

  /* =========================================================
     META COMUNI (blindato)
  ========================================================== */
  const elTitle = document.getElementById("dynamic-title");
  const elDesc = document.getElementById("dynamic-description");
  const elCanonical = document.getElementById("dynamic-canonical");

  if (elTitle) elTitle.textContent = title;
  if (elDesc) elDesc.setAttribute("content", description);
  if (elCanonical) elCanonical.setAttribute("href", canonical);
})();
