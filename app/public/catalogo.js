/* =========================================================
   CATALOGO PREMIUM – MewingMarket (Versione Patchata)
========================================================= */

async function loadProducts() {
  try {
    const res = await window.fetchUniversale("/api/products", { method: "GET" });
    const data = await res.json();
    
    console.log("🟢 [DEBUG SQL] Dati ricevuti:", data);

    // FIX: Estrae i prodotti indipendentemente da come li incapsula il backend
    let prodotti = [];
    if (Array.isArray(data)) {
        prodotti = data;
    } else if (data && data.prodotti) {
        prodotti = data.prodotti;
    } else if (data && data.data) {
        prodotti = data.data;
    }

    window.prodottiOriginali = prodotti; 
    return prodotti;
  } catch (err) {
    console.error("🔥 [CATALOGO] Errore fetch SQL:", err);
    return [];
  }
}

function clean(t) {
  return typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";
}

function getImage(p) {
  const url = p.immagine_url || p.immagine || "";
  return (url && url.length > 5) ? url : "/placeholder.webp";
}

function cardHTML(p) {
  if (!p || !p.id) return "";

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = getImage(p);
  
  let pMostrato = "0.00", pCent = 0;
  if (p.prezzo_cent) {
      pCent = Number(p.prezzo_cent);
      pMostrato = (pCent / 100).toFixed(2);
  } else if (p.prezzo) {
      pMostrato = Number(p.prezzo).toFixed(2);
      pCent = Math.round(parseFloat(pMostrato) * 100);
  }

  const desc = clean(p.descrizione_breve || "");
  const vId = p.youtube_video_id || p.video_id;
  const linkYouTube = vId 
    ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-card">📺 Guarda video su YouTube</a>` 
    : "";

  let catArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? p.categoria.split(',') : []);
  const catsAttr = catArray.map(c => clean(c.trim())).join(" ");

  return `
    <div class="product-card" data-cat="${catsAttr}" data-id="${id}">
      <div class="img-container">
        <img src="${img}" alt="${titolo}" loading="lazy">
      </div>
      <div class="card-content">
        <h2>${titolo}</h2>
        <p class="desc-breve">${desc}</p>
        ${linkYouTube} 
        <p class="prezzo">€${pMostrato}</p>
        <div class="card-buttons">
          <a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri</a>
          <div class="cart-controls">
            <button class="btn-add-cart" data-id="${id}" data-title="${titolo}" data-price-cent="${pCent}" data-img="${img}">+</button>
            <button class="btn-remove-cart" data-id="${id}">-</button>
          </div>
        </div>
      </div>
    </div>`;
}

document.addEventListener("critical-ready", async () => {
  console.log("🟢 [CATALOGO] Avvio...");
  // Nota: assicurati che avviaCatalogo() sia definita o importata correttamente
  if (typeof avviaCatalogo === "function") await avviaCatalogo();
});
