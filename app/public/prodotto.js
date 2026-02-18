// prodotto.js — versione definitiva blindata + correlati + YouTube robusto

document.addEventListener("DOMContentLoaded", async () => {

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (u) =>
    typeof u === "string" && u.startsWith("http") ? u : "";

  // Estrazione videoId da TUTTI i formati YouTube
  const extractYouTubeId = (url) => {
    if (!url) return null;

    const classic = url.match(/v=([^&]+)/);
    if (classic) return classic[1];

    const shorts = url.match(/shorts\/([^?]+)/);
    if (shorts) return shorts[1];

    const embed = url.match(/embed\/([^?]+)/);
    if (embed) return embed[1];

    return null;
  };

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const prodottoBox = document.getElementById("prodotto");
  const relatedBox = document.getElementById("related");

  if (!slug) {
    prodottoBox.innerHTML = "<p>Parametro slug mancante.</p>";
    return;
  }

  let products = [];
  try {
    const res = await fetch("/data/products.json", { cache: "no-store" });
    products = await res.json();
  } catch {
    prodottoBox.innerHTML = "<p>Errore caricamento prodotto.</p>";
    return;
  }

  const p = products.find((x) => x.slug === slug);

  if (!p) {
    prodottoBox.innerHTML = "<p>Prodotto non trovato.</p>";
    return;
  }

  const descrizione = clean(
    p.DescrizioneLunga ||
    p.Descrizione ||
    ""
  );

  const linkPayhip = safeURL(
    p.LinkPayhip ||
    p.linkPayhip ||
    ""
  );

  // YouTube (se presente)
  const ytURL = safeURL(
    p.youtube_url ||
    p.youtube_last_video_url ||
    ""
  );

  let youtubeEmbed = "";
  const videoId = extractYouTubeId(ytURL);

  if (videoId) {
    youtubeEmbed = `
      <div class="video-wrapper">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>
    `;
  }

  const img =
    (Array.isArray(p.Immagine) && p.Immagine[0]?.url) ||
    (typeof p.Immagine === "string" && p.Immagine.startsWith("http") && p.Immagine) ||
    "/placeholder.webp";

  /* ============================================================
     BLOCCO PRODOTTO
  ============================================================ */
  prodottoBox.innerHTML = `
    <div class="product-layout">

      <div class="product-video">
        ${youtubeEmbed}
      </div>

      <div class="product-main">
        <h1 class="product-title">${clean(p.Titolo)}</h1>

        <img src="${img}"
             alt="${clean(p.Titolo)}"
             class="product-image">

        <div class="product-description">
          <p>${descrizione}</p>
        </div>

        ${
          linkPayhip
            ? `<a href="${linkPayhip}" class="btn btn-primary buy-btn" target="_blank">
                 Acquista su Payhip
               </a>`
            : `<p><strong>Link Payhip mancante.</strong></p>`
        }
      </div>

    </div>
  `;

  /* ============================================================
     CORRELATI (stessa categoria)
  ============================================================ */
  if (relatedBox && p.Categoria) {
    const correlati = products
      .filter((x) => x.Categoria === p.Categoria && x.slug !== p.slug)
      .slice(0, 4);

    relatedBox.innerHTML = correlati.length
      ? correlati
          .map(
            (c) => `
          <div class="product-card">
            <img src="${
              (Array.isArray(c.Immagine) && c.Immagine[0]?.url) ||
              "/placeholder.webp"
            }" alt="${clean(c.Titolo)}">
            <h3>${clean(c.TitoloBreve || c.Titolo)}</h3>
            <a href="prodotto.html?slug=${clean(c.slug)}" class="btn">Scopri</a>
          </div>
        `
          )
          .join("")
      : "<p>Nessun prodotto correlato.</p>";
  }
});
