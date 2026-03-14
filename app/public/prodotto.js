// =========================================================
// PRODOTTO PREMIUM – MewingMarket (SQL READY)
// Versione definitiva: SQL + YouTube + Correlati + Carrello Premium
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     SANITIZZAZIONE
  ========================================================= */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (u) =>
    typeof u === "string" && u.startsWith("http") ? u : "";

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

  /* =========================================================
     1) SLUG
  ========================================================= */
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  if (!slug) {
    document.getElementById("product-title").innerText = "Slug mancante";
    return;
  }

  /* =========================================================
     2) CARICA PRODOTTO
  ========================================================= */
  let p;
  try {
    const res = await fetch(`/api/products/${slug}`, { cache: "no-store" });
    const data = await res.json();

    if (!data.success) {
      document.getElementById("product-title").innerText = "Prodotto non trovato";
      return;
    }

    p = data.prodotto;

  } catch (err) {
    console.error(err);
    document.getElementById("product-title").innerText = "Errore caricamento prodotto";
    return;
  }

  /* =========================================================
     3) HERO
  ========================================================= */
  document.getElementById("product-title").innerText = clean(p.titolo);

  // SQL non ha più titolo_breve → lo generiamo noi
  const subtitle = p.titolo.split(" ").slice(0, 3).join(" ");
  document.getElementById("product-subtitle").innerText = clean(subtitle);

  document.getElementById("product-price").innerText = p.prezzo ? `${p.prezzo}€` : "";

  const img = p.immagine || "/placeholder.webp";
  document.getElementById("product-image").src = img;
  document.getElementById("product-image").alt = clean(p.titolo);

  /* =========================================================
     4) VIDEO YOUTUBE
  ========================================================= */
  const ytURL =
    safeURL(p.youtube_url) ||
    safeURL(p.youtube_last_video_url) ||
    "";

  const videoId = extractYouTubeId(ytURL);

  if (videoId) {
    const videoSection = document.getElementById("video-section");
    const iframe = document.getElementById("product-video");

    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    videoSection.style.display = "block";
  }

  /* =========================================================
     5) DESCRIZIONE
  ========================================================= */
  document.getElementById("product-description").textContent =
    p.descrizione || "";

  /* =========================================================
     6) ACQUISTA ORA — checkout single
  ========================================================= */
  document.getElementById("btn-acquista").addEventListener("click", () => {

    aggiungiAlCarrello({
      slug: p.slug,
      titolo: p.titolo,
      prezzo: p.prezzo,
      immagine: p.immagine
    });

    aggiornaBadgeCarrello();

    window.location.href = `checkout.html?slug=${p.slug}`;
  });

  /* =========================================================
     7) AGGIUNGI AL CARRELLO — guest OK
  ========================================================= */
  document.getElementById("btn-carrello").addEventListener("click", () => {

    aggiungiAlCarrello({
      slug: p.slug,
      titolo: p.titolo,
      prezzo: p.prezzo,
      immagine: p.immagine
    });

    aggiornaBadgeCarrello();

    if (!isLogged()) {
      alert("Per completare l'acquisto dovrai fare login in checkout.");
    }
  });

  /* =========================================================
     8) CORRELATI (SQL READY)
     /api/products NON supporta ?categoria=
     → li filtriamo lato client
  ========================================================= */
  try {
    const res = await fetch(`/api/products`, { cache: "no-store" });
    const data = await res.json();

    const relatedBox = document.getElementById("related");

    if (data.success && Array.isArray(data.prodotti)) {
      const correlati = data.prodotti
        .filter((x) => x.slug !== p.slug && x.categoria === p.categoria)
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

  /* =========================================================
     9) BADGE ALL'AVVIO
  ========================================================= */
  if (typeof aggiornaBadgeCarrello === "function") {
    aggiornaBadgeCarrello();
  }
});
