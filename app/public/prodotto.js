// =========================================================
// File: app/public/prodotto.js
// Versione definitiva: Airtable + API interne + correlati + YouTube
// =========================================================

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

  // ============================================================
  // 1) CARICA PRODOTTO DA API INTERNA
  // ============================================================
  let p;
  try {
    const res = await fetch(`/api/products/${slug}`, { cache: "no-store" });
    const data = await res.json();

    if (!data.success) {
      prodottoBox.innerHTML = "<p>Prodotto non trovato.</p>";
      return;
    }

    p = data.product;

  } catch (err) {
    console.error(err);
    prodottoBox.innerHTML = "<p>Errore caricamento prodotto.</p>";
    return;
  }

  // ============================================================
  // 2) PREPARA CAMPI
  // ============================================================
  const descrizione = clean(p.descrizione || "");

  const paypalLink = safeURL(p.paypal_link || "");

  const ytURL = safeURL(p.youtube_url || "");

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

  const img = p.immagine || "/placeholder.webp";

  // ============================================================
  // 3) RENDER BLOCCO PRODOTTO
  // ============================================================
  prodottoBox.innerHTML = `
    <div class="product-layout">

      <div class="product-video">
        ${youtubeEmbed}
      </div>

      <div class="product-main">
        <h1 class="product-title">${clean(p.titolo)}</h1>

        <img src="${img}"
             alt="${clean(p.titolo)}"
             class="product-image">

        <div class="product-description">
          <p>${descrizione}</p>
        </div>

        ${
          paypalLink
            ? `<a href="${paypalLink}" class="btn btn-primary buy-btn" target="_blank">
                 Acquista con PayPal
               </a>`
            : `<p><strong>Link PayPal mancante.</strong></p>`
        }
      </div>

    </div>
  `;

  // ============================================================
  // 4) CORRELATI (API INTERNA)
  // ============================================================
  try {
    const res = await fetch(`/api/products?categoria=${encodeURIComponent(p.categoria)}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.products)) {
      const correlati = data.products
        .filter((x) => x.slug !== p.slug)
        .slice(0, 4);

      relatedBox.innerHTML = correlati.length
        ? correlati
            .map(
              (c) => `
            <div class="product-card">
              <img src="${c.immagine || "/placeholder.webp"}" alt="${clean(c.titolo)}">
              <h3>${clean(c.titolo)}</h3>
              <a href="prodotto.html?slug=${clean(c.slug)}" class="btn">Scopri</a>
            </div>
          `
            )
            .join("")
        : "<p>Nessun prodotto correlato.</p>";
    }
  } catch (err) {
    console.warn("Errore correlati:", err);
  }
});
