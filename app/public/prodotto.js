// prodotto.js — versione definitiva con supporto YouTube

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     UTILS
  ========================================================= */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (u) =>
    typeof u === "string" && u.startsWith("http") ? u : "";

  /* =========================================================
     1. OTTIENI SLUG DALL'URL
  ========================================================= */
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    document.getElementById("prodotto").innerHTML =
      "<p>Parametro slug mancante.</p>";
    return;
  }

  /* =========================================================
     2. CARICA PRODUCTS.JSON
  ========================================================= */
  let products = [];
  try {
    const res = await fetch("/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("products.json non disponibile");
    products = await res.json();
  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    document.getElementById("prodotto").innerHTML =
      "<p>Errore caricamento prodotto.</p>";
    return;
  }

  /* =========================================================
     3. TROVA IL PRODOTTO
  ========================================================= */
  const p = products.find((x) => x.slug === slug);

  if (!p) {
    document.getElementById("prodotto").innerHTML =
      "<p>Prodotto non trovato.</p>";
    return;
  }

  /* =========================================================
     4. COSTRUISCI EMBED YOUTUBE (SE PRESENTE)
  ========================================================= */
  const ytURL =
    safeURL(p.youtube_url) ||
    safeURL(p.youtube_last_video_url) ||
    "";

  let youtubeEmbed = "";
  if (ytURL) {
    const videoId = ytURL.split("v=")[1]?.split("&")[0];
    if (videoId) {
      youtubeEmbed = `
        <div class="video-wrapper">
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            title="${clean(p.youtube_title || p.youtube_last_video_title || "")}"
            frameborder="0"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
      `;
    }
  }

  /* =========================================================
     5. COSTRUISCI HTML PRODOTTO
  ========================================================= */
  const html = `
    <div class="product-hero">
      <img src="${p.Immagine?.[0]?.url || "/placeholder.webp"}"
           alt="${clean(p.Titolo || "")}"
           class="product-image">

      <div class="product-info">
        <h1>${clean(p.Titolo || "")}</h1>
        <p class="price">€${p.Prezzo || "0"}</p>

        <a href="${safeURL(p.linkPayhip)}"
           target="_blank"
           rel="noopener noreferrer"
           class="btn btn-primary">
          Acquista su Payhip
        </a>
      </div>
    </div>

    ${youtubeEmbed}

    <div class="product-description">
      <h2>Descrizione</h2>
      <p>${clean(p.Descrizione || "")}</p>
    </div>
  `;

  document.getElementById("prodotto").innerHTML = html;

  /* =========================================================
     6. CORRELATI (STESSA CATEGORIA)
  ========================================================= */
  const relatedBox = document.getElementById("related");
  if (relatedBox) {
    const related = products
      .filter((x) => x.Categoria === p.Categoria && x.slug !== p.slug)
      .slice(0, 4);

    relatedBox.innerHTML = related.length
      ? related
          .map((r) => {
            const img = r.Immagine?.[0]?.url || "/placeholder.webp";
            return `
              <a href="prodotto.html?slug=${clean(r.slug)}" class="related-card">
                <img src="${img}" alt="${clean(r.TitoloBreve || r.Titolo || "")}">
                <h3>${clean(r.TitoloBreve || r.Titolo || "")}</h3>
              </a>
            `;
          })
          .join("")
      : "<p>Nessun prodotto correlato.</p>";
  }
});
