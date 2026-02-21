// =========================================================
// File: app/public/prodotto.js
// Versione MAX (UX Premium) — Airtable + API interne + correlati
// + LOGIN CHECK + CHECKOUT REDIRECT
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

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

  // ============================================================
  // 1) OTTIENI SLUG DALL'URL
  // ============================================================
  const slug = window.location.pathname.split("/").pop();

  if (!slug) {
    document.getElementById("product-title").innerText = "Slug mancante";
    return;
  }

  // ============================================================
  // 2) CARICA PRODOTTO DA API INTERNA
  // ============================================================
  let p;
  try {
    const res = await fetch(`/api/products/${slug}`, { cache: "no-store" });
    const data = await res.json();

    if (!data.success) {
      document.getElementById("product-title").innerText = "Prodotto non trovato";
      return;
    }

    p = data.product;

  } catch (err) {
    console.error(err);
    document.getElementById("product-title").innerText = "Errore caricamento prodotto";
    return;
  }

  // ============================================================
  // 3) POPOLA HERO
  // ============================================================
  document.getElementById("product-title").innerText = clean(p.titolo);
  document.getElementById("product-subtitle").innerText = clean(p.titolo_breve || "");
  document.getElementById("product-price").innerText = p.prezzo ? `${p.prezzo}€` : "";

  const img = p.immagine || "/placeholder.webp";
  document.getElementById("product-image").src = img;
  document.getElementById("product-image").alt = clean(p.titolo);

  // ============================================================
  // 4) VIDEO YOUTUBE
  // ============================================================
  const ytURL = safeURL(p.youtube_url || "");
  const videoId = extractYouTubeId(ytURL);

  if (videoId) {
    const videoSection = document.getElementById("video-section");
    const iframe = document.getElementById("product-video");

    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    videoSection.style.display = "block";
  }

  // ============================================================
  // 5) DESCRIZIONE
  // ============================================================
  document.getElementById("product-description").innerHTML = clean(p.descrizione || "");

  // ============================================================
  // 6) ACQUISTO — LOGIN CHECK + REDIRECT
  // ============================================================

  const btnAcquista = document.getElementById("btn-acquista");

  btnAcquista.addEventListener("click", () => {
    const session = localStorage.getItem("session");

    // Utente NON loggato → login con redirect
    if (!session) {
      window.location.href = `dashboard-login.html?redirect=${slug}`;
      return;
    }

    // Utente loggato → checkout
    window.location.href = `/checkout.html?slug=${slug}`;
  });

  // ============================================================
  // 7) CARRELLO (opzionale)
  // ============================================================
  document.getElementById("btn-carrello").addEventListener("click", () => {
    if (window.addToCart) {
      addToCart({
        slug: p.slug,
        titolo: p.titolo,
        prezzo: p.prezzo,
        immagine: p.immagine
      });
      alert("Aggiunto al carrello");
    }
  });

  // ============================================================
  // 8) CORRELATI
  // ============================================================
  try {
    const res = await fetch(`/api/products?categoria=${encodeURIComponent(p.categoria)}`);
    const data = await res.json();

    const relatedBox = document.getElementById("related");

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
              <a href="/prodotto/${clean(c.slug)}" class="btn">Scopri</a>
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
