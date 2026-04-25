// =========================================================
// PRODOTTO PREMIUM – MewingMarket (PATCH 2027.400)
// - critical-ready
// - fetchUniversale (fallback chain)
// - FIX: innerHTML per AI & rimozione singola qty
// =========================================================

document.addEventListener("critical-ready", async () => {

  /* =========================================================
     SANITIZZAZIONE & UTILS
  ========================================================== */
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
     1) ID PRODOTTO
  ========================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (!id) {
    const titleEl = document.getElementById("product-title");
    if (titleEl) titleEl.innerText = "ID prodotto mancante";
    return;
  }

  /* =========================================================
     2) CARICA DATI DAL SERVER (SQL)
  ========================================================== */
  let p;
  try {
    const res = await window.fetchUniversale(
      `/products/${id}`,
      { cache: "no-store" },
      { retries: 3, backoffMs: 400 }
    );

    const data = await res.json();

    if (!data || !data.success) {
      document.getElementById("product-title").innerText = "Prodotto non trovato";
      return;
    }

    p = data.prodotto;

  } catch (err) {
    console.error("[PRODOTTO] Errore fetch:", err);
    document.getElementById("product-title").innerText = "Errore di connessione";
    return;
  }

  /* =========================================================
     3) RENDERING HERO (Immagine, Titolo, Prezzo)
  ========================================================== */
  document.getElementById("product-title").innerText = clean(p.titolo);

  // Genera un sottotitolo dinamico se non presente
  const subtitle = p.descrizione_breve || (p.titolo || "").split(" ").slice(0, 3).join(" ");
  document.getElementById("product-subtitle").innerText = clean(subtitle);

  const prezzo_cent = Number(p.prezzo_cent) || 0;
  const prezzo = (prezzo_cent / 100).toFixed(2);

  document.getElementById("product-price").innerText = `${prezzo}€`;

  const imgEl = document.getElementById("product-image");
  imgEl.src = p.immagine || "/placeholder.webp";
  imgEl.alt = clean(p.titolo);

  /* =========================================================
     4) VIDEO YOUTUBE (Sync Service)
  ========================================================== */
  const ytURL = safeURL(p.youtube_url);
  const videoId = extractYouTubeId(ytURL || p.youtube_video_id);

  if (videoId) {
    const videoSection = document.getElementById("video-section");
    const iframe = document.getElementById("product-video");
    if (videoSection && iframe) {
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      videoSection.style.display = "block";
    }
  }

  /* =========================================================
     5) DESCRIZIONE LUNGA (AI Content)
     PATCH: innerHTML per supportare la formattazione AI
  ========================================================== */
  const descEl = document.getElementById("product-description");
  if (descEl) {
    descEl.innerHTML = p.descrizione_lunga || "Nessuna descrizione disponibile.";
  }

  /* =========================================================
     6) AZIONI CARRELLO (Acquista, Aggiungi, Rimuovi)
  ========================================================== */
  const payloadCarrello = {
    id: p.id,
    titolo: p.titolo,
    prezzo_cent: prezzo_cent,
    prezzo: prezzo,
    immagine: p.immagine
  };

  // BOTTONE ACQUISTA ORA
  document.getElementById("btn-acquista").addEventListener("click", () => {
    if (typeof aggiungiAlCarrello === "function") {
      aggiungiAlCarrello(payloadCarrello);
    }
    window.location.href = `checkout.html?id=${p.id}`;
  });

  // BOTTONE AGGIUNGI AL CARRELLO
  document.getElementById("btn-carrello").addEventListener("click", () => {
    if (typeof aggiungiAlCarrello === "function") {
      aggiungiAlCarrello(payloadCarrello);
      if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();
    }
  });

  // BOTTONE RIMUOVI (Fix: Rimuove 1 unità alla volta)
  const btnRemove = document.getElementById("btn-remove-cart");
  if (btnRemove) {
    btnRemove.addEventListener("click", () => {
      if (typeof rimuoviSingoloDalCarrello === "function") {
        rimuoviSingoloDalCarrello(p.id);
        if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();
      }
    });
  }

  /* =========================================================
     7) PRODOTTI CORRELATI (Patch Categorie)
  ========================================================== */
  try {
    const resProd = await window.fetchUniversale(`/products`, { cache: "no-store" });
    const dataProd = await resProd.json();
    const relatedBox = document.getElementById("related");

    if (relatedBox && dataProd.success && Array.isArray(dataProd.prodotti)) {
      const categorieProdotto = Array.isArray(p.categoria) ? p.categoria : (p.categoria || "").split(",");
      
      const correlati = dataProd.prodotti
        .filter(x => x.id !== p.id)
        .filter(x => {
          const xCats = Array.isArray(x.categoria) ? x.categoria : (x.categoria || "").split(",");
          return xCats.some(c => categorieProdotto.includes(c.trim()));
        })
        .slice(0, 4);

      relatedBox.innerHTML = correlati.length
        ? correlati.map(c => `
            <div class="product-card">
              <img src="${c.immagine || "/placeholder.webp"}" alt="${clean(c.titolo)}">
              <h3>${clean(c.titolo_breve || c.titolo)}</h3>
              <a href="prodotto.html?id=${c.id}" class="btn-dettagli">Scopri di più</a>
            </div>
          `).join("")
        : "<p>Nessun prodotto correlato trovato.</p>";
    }
  } catch (err) {
    console.warn("[PRODOTTO] Errore caricamento correlati:", err);
  }

  // Update badge iniziale
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();
});
