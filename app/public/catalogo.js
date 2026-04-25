// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH NUCLEARE 2027.500
// =========================================================

/* 1) CARICA PRODOTTI DAL SERVER */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");
  try {
    // Usiamo fetchUniversale garantita dal loader
    const res = await window.fetchUniversale("/api/products", { method: "GET" });
    const data = await res.json();
    
    // Normalizzazione dati in base alla risposta del server SQL
    let prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);
    window.prodottiOriginali = prodotti; 
    return prodotti;
  } catch (err) {
    console.error("🔥 [CATALOGO] Errore fetch:", err);
    return [];
  }
}

/* 2) UTILITY FORMATTAZIONE */
function clean(t) {
  return typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";
}

function getImage(p) {
  const url = p.immagine || p.immagine_url || "";
  return (url && url.length > 5) ? url : "/placeholder.webp";
}

/* 3) CARD PRODOTTO (HTML) */
function cardHTML(p) {
  if (!p || !p.id) return "";

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = getImage(p);
  
  // Gestione Prezzo (Priorità ai centesimi SQL)
  let pMostrato = "0.00", pCent = 0;
  if (p.prezzo_cent) {
      pCent = Number(p.prezzo_cent);
      pMostrato = (pCent / 100).toFixed(2);
  } else if (p.prezzo) {
      pMostrato = Number(p.prezzo).toFixed(2);
      pCent = Math.round(parseFloat(pMostrato) * 100);
  }

  const desc = clean(p.descrizione_breve || "");
  
  // Gestione Categorie (Stringa o Array)
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

/* 4) LOGICA CORE & GENERAZIONE CATEGORIE */
async function avviaCatalogo(prodottiDaMostrare = null) {
  const container = document.getElementById("catalogo");
  if (!container) return;

  const products = prodottiDaMostrare || await loadProducts();
  
  if (!products || products.length === 0) {
    container.innerHTML = `<p class="no-products">Nessun prodotto trovato in questa categoria.</p>`;
    return;
  }

  container.innerHTML = products.map(p => cardHTML(p)).join("");

  // Genera i bottoni delle categorie solo al primo avvio (quando carichiamo tutto)
  const catBox = document.getElementById("categorie");
  if (catBox && !prodottiDaMostrare) {
    const tutteLeCat = window.prodottiOriginali.flatMap(p => 
      Array.isArray(p.categoria) ? p.categoria : (p.categoria ? p.categoria.split(',') : [])
    );
    const categorieUniche = [...new Set(tutteLeCat.map(c => c.trim()))].filter(c => c !== "");

    catBox.innerHTML = `<button class="btn-filtro active" data-cat="all">Tutti</button>` + 
      categorieUniche.map(c => `<button class="btn-filtro" data-cat="${clean(c)}">${clean(c)}</button>`).join("");
    
    // Agganciamo l'evento click alle categorie appena create
    catBox.querySelectorAll('.btn-filtro').forEach(btn => {
      btn.onclick = () => {
        catBox.querySelectorAll('.btn-filtro').forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        const s = btn.dataset.cat;
        avviaCatalogo(s === "all" ? window.prodottiOriginali : window.prodottiOriginali.filter(p => {
          const pCats = Array.isArray(p.categoria) ? p.categoria : (p.categoria || "").split(',');
          return pCats.map(c => c.trim()).includes(s);
        }));
      };
    });
  }
}

/* 5) GESTIONE EVENTI (FILTRI & CARRELLO) */
function inizializzaListeners() {
  // FILTRI PREZZO
  document.querySelectorAll(".filtri-prezzo .btn-filtro[data-prezzo]").forEach(btn => {
    btn.onclick = () => {
      const soglia = parseFloat(btn.dataset.prezzo);
      avviaCatalogo(window.prodottiOriginali.filter(p => {
        const prezzo = p.prezzo_cent ? p.prezzo_cent/100 : p.prezzo;
        return prezzo <= soglia;
      }));
    };
  });

  // RESET FILTRI
  const br = document.getElementById("reset");
  if (br) br.onclick = () => avviaCatalogo(window.prodottiOriginali);

  // AGGIUNTA E RIMOZIONE CARRELLO (Delegation sul container del catalogo)
  const catalogoContainer = document.getElementById("catalogo");
  if (catalogoContainer) {
    catalogoContainer.onclick = (e) => {
      // TASTO +
      const btnAdd = e.target.closest(".btn-add-cart");
      if (btnAdd) {
        const p = { 
          id: btnAdd.dataset.id, 
          titolo: btnAdd.dataset.title, 
          prezzo_cent: Number(btnAdd.dataset.priceCent), 
          immagine: btnAdd.dataset.img 
        };
        // window.aggiungiAlCarrello è definita in carrello.js
        if (typeof window.aggiungiAlCarrello === "function") { 
          window.aggiungiAlCarrello(p); 
        }
        return;
      }

      // TASTO -
      const btnRem = e.target.closest(".btn-remove-cart");
      if (btnRem) {
        const id = btnRem.dataset.id;
        // window.rimuoviSingoloDalCarrello è definita in carrello.js
        if (typeof window.rimuoviSingoloDalCarrello === "function") { 
          window.rimuoviSingoloDalCarrello(id); 
        }
      }
    };
  }
}

/* 6) BOOTSTRAP — SINCRONIZZATO CON IL LOADER */
document.addEventListener("critical-ready", async () => {
  console.log("🟢 [CATALOGO] Sistema pronto, avvio UI...");
  await avviaCatalogo();
  inizializzaListeners();
});
