// prodotto.js — versione definitiva corretta

document.addEventListener("DOMContentLoaded", async () => {

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (u) =>
    typeof u === "string" && u.startsWith("http") ? u : "";

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

  // Descrizione lunga corretta
  const descrizione = clean(
    p.DescrizioneLunga ||
    p.Descrizione ||
    ""
  );

  // Link Payhip corretto
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
  if (ytURL.includes("youtube.com")) {
    const videoId = ytURL.split("v=")[1]?.split("&")[0];
    if (videoId) {
      youtubeEmbed = `
        <div class="video-wrapper">
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            frameborder="0"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
      `;
    }
  }

  document.getElementById("prodotto").innerHTML = `
    <div class="product-hero">
      <img src="${p.Immagine?.[0]?.url || "/placeholder.webp"}"
           alt="${clean(p.Titolo)}"
           class="product-image">

      <div class="product-info">
        <h1>${clean(p.Titolo)}</h1>
        <p class="price">€${p.Prezzo}</p>

        <a href="${linkPayhip}" class="btn btn-primary" target="_blank">
          Acquista su Payhip
        </a>
      </div>
    </div>

    ${youtubeEmbed}

    <div class="product-description">
      <h2>Descrizione</h2>
      <p>${descrizione}</p>
    </div>
  `;
});
