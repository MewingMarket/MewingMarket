/* =========================================================
   HOME PREMIUM — MewingMarket (PATCH 2027.600)
   - YouTube Auto-Link nelle 3 card
   - Sincronizzazione SQL (data.success fix)
   ========================================================= */

document.addEventListener("critical-ready", () => {
  console.log("[HOME] Inizializzazione homepage con Patch YouTube...");

  // ------------------------------
  // 1) GRID HOMEPAGE (Top 3 Prodotti con YouTube)
  // ------------------------------
  (async () => {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    try {
      // Usiamo fetchUniversale che è già patchata per il token e alias
      const res = await window.fetchUniversale("/api/products");
      const data = await res.json();

      // Normalizzazione SQL: gestisce sia {success:true, prodotti:[]} che l'array diretto
      const products = Array.isArray(data) ? data : (data.prodotti || data.data || []);

      if (products.length === 0) {
        grid.innerHTML = `<p>Il catalogo sarà presto disponibile.</p>`;
        return;
      }

      grid.innerHTML = "";

      products.slice(0, 3).forEach((p) => {
        const img = p.immagine || p.immagine_url || "/placeholder.webp";
        const titolo = p.titolo || "Prodotto";
        const descrizione = p.descrizione_breve || "";
        const prezzo = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
        const id = p.id;

        // --- PATCH YOUTUBE ---
        const videoId = p.youtube_id || p.video_id;
        const linkYouTube = videoId 
          ? `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="yt-link-home">📺 Guarda video su YouTube</a>` 
          : "";

        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
          <div class="img-container">
            <img src="${img}" alt="${titolo}" loading="lazy">
          </div>
          <h3>${titolo}</h3>
          <p class="desc-breve">${descrizione}</p>
          ${linkYouTube}
          <p class="price">€${prezzo}</p>

          <div class="card-buttons">
            <a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri</a>
            <button class="btn-add-cart" onclick="window.aggiungiAlCarrello({id:'${id}', titolo:'${titolo}', prezzo_cent:${p.prezzo_cent}, immagine:'${img}'})">+</button>
          </div>
        `;
        grid.appendChild(card);
      });

    } catch (err) {
      console.error("Errore caricamento prodotti home:", err);
      grid.innerHTML = `<p>Al momento il catalogo non è raggiungibile.</p>`;
    }
  })();

  // ------------------------------
  // 2) SLIDER HERO (Sincronizzato)
  // ------------------------------
  (async () => {
    try {
      const resHero = await window.fetchUniversale("/api/products");
      const dataHero = await resHero.json();
      const productsHero = Array.isArray(dataHero) ? dataHero : (dataHero.prodotti || []);
      const images = productsHero.map(p => p.immagine || p.immagine_url).filter(img => img && img.length > 5);

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
        setInterval(rotate, 5000);
      }
    } catch (e) {}
  })();
});
