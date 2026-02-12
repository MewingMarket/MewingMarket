// prodotto.js — versione blindata + YouTube fix totale

/* =========================================================
   SANITIZZAZIONE
========================================================= */
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";

/* =========================================================
   URL SICURI
========================================================= */
function safeURL(url) {
  return typeof url === "string" && url.startsWith("http") ? url : "";
}

/* =========================================================
   YOUTUBE ID EXTRACTOR (blindato)
========================================================= */
function extractYouTubeID(url) {
  if (!url || typeof url !== "string") return null;

  try {
    // youtu.be
    if (url.includes("youtu.be/")) {
      return clean(url.split("youtu.be/")[1].split("?")[0]);
    }

    // watch?v=
    if (url.includes("watch?v=")) {
      return clean(url.split("watch?v=")[1].split("&")[0]);
    }

    // embed
    if (url.includes("embed/")) {
      return clean(url.split("embed/")[1].split("?")[0]);
    }
  } catch {
    return null;
  }

  return null;
}

/* =========================================================
   YOUTUBE EMBED (blindato)
========================================================= */
function renderYouTubeEmbed(p) {
  const id = extractYouTubeID(p.youtube_url);
  if (!id) return "";

  return `
    <div class="video-embed">
      <iframe
        src="https://www.youtube.com/embed/${id}"
        title="YouTube video"
        loading="lazy"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    </div>
  `;
}

/* =========================================================
   INIT PRODOTTO (blindato)
========================================================= */
(async function () {
  const params = new URLSearchParams(window.location.search);
  const slug = clean(params.get("slug"));

  if (!slug) {
    console.warn("Nessuno slug presente");
    return;
  }

  /* ----------------------------
     FETCH PRODOTTI (blindato)
  ----------------------------- */
  let products = [];
  try {
    const res = await fetch("products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Errore fetch products.json");
    products = await res.json();
    if (!Array.isArray(products)) products = [];
  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    return;
  }

  /* ----------------------------
     TROVA PRODOTTO
  ----------------------------- */
  const p = products.find(pr => pr.slug === slug);
  if (!p) {
    console.warn("Prodotto non trovato:", slug);
    return;
  }

  /* ----------------------------
     ELEMENTI DOM (blindati)
  ----------------------------- */
  const container = document.getElementById("prodotto");
  if (!container) {
    console.error("Elemento #prodotto mancante");
    return;
  }

  /* ----------------------------
     RENDER PRODOTTO (blindato)
  ----------------------------- */
  const img = safeURL(p.immagine) || "img/placeholder.webp";
  const titolo = clean(p.titolo);
  const descrizione = clean(p.descrizioneLunga || p.descrizioneBreve || "");
  const prezzo = clean(String(p.prezzo));
  const linkPayhip = safeURL(p.linkPayhip);

  container.innerHTML = `
    <div class="hero-wrapper">
      <div class="hero-media">
        <img src="${img}" alt="${titolo}" loading="lazy">
        ${renderYouTubeEmbed(p)}
      </div>

      <div class="hero-content">
        <h1>${titolo}</h1>
        <p>${descrizione}</p>
        <p class="prezzo">€${prezzo}</p>
        <a href="${linkPayhip}" class="btn-acquista" target="_blank" rel="noopener noreferrer">Acquista ora</a>
      </div>
    </div>
  `;

  /* =========================================================
     PRODOTTI CORRELATI (blindato)
  ========================================================== */
  const relatedBox = document.getElementById("related");
  if (!relatedBox) return;

  const correlati = products
    .filter(pr => pr.categoria === p.categoria && pr.slug !== slug)
    .slice(0, 4);

  let html = "";
  correlati.forEach(pr => {
    const imgR = safeURL(pr.immagine) || "img/placeholder.webp";
    const titoloR = clean(pr.titoloBreve || pr.titolo);
    const descrizioneR = clean(pr.descrizioneBreve || "");
    const prezzoR = clean(String(pr.prezzo));
    const slugR = clean(pr.slug);

    html += `
      <div class="product-card">
        <img src="${imgR}" alt="${titoloR}" loading="lazy">
        <h2>${titoloR}</h2>
        <p>${descrizioneR}</p>
        <p class="prezzo">€${prezzoR}</p>
        <a href="prodotto.html?slug=${slugR}" class="btn">Scopri di più</a>
      </div>
    `;
  });

  relatedBox.innerHTML = html;
})();
