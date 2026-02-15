// prodotto.js — versione definitiva corretta + embed YouTube robusto

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

    // Formato classico
    const classic = url.match(/v=([^&]+)/);
    if (classic) return classic[1];

    // Shorts
    const shorts = url.match(/shorts\/([^?]+)/);
    if (shorts) return shorts[1];

    // Embed
    const embed = url.match(/embed\/([^?]+)/);
    if (embed) return embed[1];

    return null;
  };

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    document.getElementById("prodotto").innerHTML =
      "<p>Parametro slug mancante.</p>";
    return;
  }

  let products = [];
  try {
    const res = await fetch("/products.json", { cache: "no-store" });
    products = await res.json();
  } catch {
    document.getElementById("prodotto").innerHTML =
      "<p>Errore caricamento prodotto.</p>";
    return;
  }

  const p = products.find((x) => x.slug === slug);

  if (!p) {
    document.getElementById("prodotto").innerHTML =
      "<p>Prodotto non trovato.</p>";
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

  /* ============================================================
     PATCH GRAFICA — SOLO QUESTO BLOCCO È STATO MODIFICATO
  ============================================================ */
  document.getElementById("prodotto").innerHTML = `
    <div class="product-layout">

      <div class="product-video">
        ${youtubeEmbed}
      </div>

      <div class="product-main">
        <h1 class="product-title">${clean(p.Titolo)}</h1>

        <img src="${p.Immagine?.[0]?.url || "/placeholder.webp"}"
             alt="${clean(p.Titolo)}"
             class="product-image">

        <div class="product-description">
          <p>${descrizione}</p>
        </div>

        <a href="${linkPayhip}" class="btn btn-primary buy-btn" target="_blank">
          Acquista su Payhip
        </a>
      </div>

    </div>
  `;
});
