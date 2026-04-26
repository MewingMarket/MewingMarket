/* =========================================================
   CATALOGO PREMIUM – MewingMarket
   Versione SQL definitiva + FIX Caricamento (Standard Fetch)
========================================================= */

async function loadProducts() {
  try {
    console.log("🛠️ Caricamento prodotti in corso...");
    
    // ⭐ PATCH: Usiamo fetch standard perché fetchUniversale sta bloccando l'esecuzione
    const res = await fetch("/api/products", { method: "GET" });
    const data = await res.json();
    
    console.log("🟢 [DEBUG SQL] Dati ricevuti:", data);

    // Normalizzazione SQL: accetta array o oggetto con chiavi 'prodotti'/'data'
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

/* 2) GET IMAGE — Mapping su immagine_url (SQL) */
function getImage(p) {
  const url = p.immagine_url || p.immagine || "";
  return (url && url.length > 5) ? url : "/placeholder.webp";
}

/* 3) CARD PRODOTTO (HTML) — Mapping su youtube_video_id (SQL) */
function cardHTML(p) {
  if (!p || !p.id) return "";

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = getImage(p);
  
  // Gestione Prezzo (Priorità prezzo_cent SQL)
  let pMostrato = "0.00", pCent = 0;
  if (p.prezzo_cent) {
      pCent = Number(p.prezzo_cent);
      pMostrato = (pCent / 100).toFixed(2);
  } else if (p.prezzo) {
      pMostrato = Number(p.prezzo).toFixed(2);
      pCent = Math.round(parseFloat(pMostrato) * 100);
  }

  const desc = clean(p.descrizione_breve || "");
  
  // --- PATCH YOUTUBE (Mapping SQL youtube_video_id) ---
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
            <button class="btn-add-cart" 
              data-id="${id}" data-title="${titolo}" 
              data-price-cent="${pCent}" data-img="${img}">+</button>
            <button class="btn-remove-cart" data-id="${id}">-</button>
          </div>
        </div>
      </div>
    </div>`;
}

// Inizializzazione sincronizzata con il loader globale
document.addEventListener("critical-ready", async () => {
  console.log("🟢 [CATALOGO] Avvio con Mapping SQL...");
  
  // Recuperiamo i prodotti
  const lista = await loadProducts();
  
  // Se abbiamo prodotti, popoliamo la griglia immediatamente
  const grid = document.getElementById("grid-prodotti") || document.querySelector(".products-grid");
  if (grid) {
      if (lista.length > 0) {
          grid.innerHTML = lista.map(p => cardHTML(p)).join("");
          console.log("✅ Griglia popolata con successo.");
      } else {
          grid.innerHTML = "<p>Nessun prodotto disponibile al momento.</p>";
      }
  }

  // Se esiste una funzione avviaCatalogo per filtri e listeners, la chiamiamo
  if (typeof avviaCatalogo === "function") {
      await avviaCatalogo();
  }
});
