/* =========================================================
   HOME PREMIUM — MewingMarket (PATCH 2027.900)
   - Mapping SQL: youtube_video_id + immagine_url
   - UI: Rimosso tasto "+" (Solo tasto Scopri)
   - Endpoint aggiornati a Java‑mode
========================================================= */

document.addEventListener("critical-ready", () => {
  console.log("[HOME] Inizializzazione homepage con Mapping SQL...");

  // ------------------------------
  // 1) GRID HOMEPAGE (Top 3 Prodotti)
  // ------------------------------
  (async () => {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    try {
      // ⭐ PATCH 2027 — nuovo endpoint Java‑mode
      const res = await fetch("/api/prodotti/getProdotti");
      const data = await res.json();

      // Normalizzazione dati SQL
      const products = Array.isArray(data) ? data : (data.prodotti || data.data || []);

      if (products.length === 0) {
        grid.innerHTML = `<p class="info-msg">Il catalogo prodotti è in fase di aggiornamento.</p>`;
        return;
      }

      grid.innerHTML = "";

      // Prendiamo i primi 3 per la vetrina
      products.slice(0, 3).forEach((p) => {
        // MAPPING SQL
        const img = p.immagine_url || p.immagine || "/placeholder.webp";
        const titolo = p.titolo || "Prodotto";
        const descrizione = p.descrizione_breve || "";
        const prezzo = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
        const id = p.id;

        // PATCH YOUTUBE
        const vId = p.youtube_video_id || p.video_id;
        const linkYouTube = vId 
          ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-home">📺 Guarda video su YouTube</a>` 
          : "";

        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
          <div class="img-container">
            <img src="${img}" alt="${titolo}" loading="lazy">
          </div>
          <div class="card-body">
            <h3>${titolo}</h3>
            <p class="desc-breve">${descrizione}</p>
            ${linkYouTube}
            <p class="price">€${prezzo}</p>

            <div class="card-buttons">
              <a href="prodotto.html?id=${id}" class="btn-dettagli" style="width: 100%; text-align: center;">Scopri di più</a>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

    } catch (err) {
      console.error("🔥 [HOME] Errore SQL:", err);
      grid.innerHTML = `<p>Al momento non è possibile caricare i prodotti in evidenza.</p>`;
    }
  })();

  // ------------------------------
  // 2) SLIDER HERO (Immagini dinamiche da SQL)
  // ------------------------------
  (async () => {
    try {
      // ⭐ PATCH 2027 — nuovo endpoint Java‑mode
      const resHero = await fetch("/api/prodotti/getProdotti");
      const dataHero = await resHero.json();
      const productsHero = Array.isArray(dataHero) ? dataHero : (dataHero.prodotti || []);
      
      const images = productsHero
        .map(p => p.immagine_url || p.immagine)
        .filter(img => img && img.length > 5);

      const slider = document.getElementById("hero-slider");
      if (slider && images.length > 0) {
        let index = 0;
        const rotate = () => {
          slider.style.opacity = 0;
          setTimeout(() => {
            slider.src = images[index];
            slider.style.opacity = 1;
            index = (index + 1) % images.length;
          }, 400);
        };
        rotate();
        setInterval(rotate, 6000);
      }
    } catch (e) {
      console.warn("[HOME] Slider non disponibile.");
    }
  })();
});
