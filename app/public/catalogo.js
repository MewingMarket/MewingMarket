// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH NUCLEARE 2027
// Con Estrazione Automatica Categorie dai Prodotti
// =========================================================

/* 1) CARICA PRODOTTI (Flessibile) */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");
  try {
    const res = await window.fetchUniversale("/products", { cache: "no-store" });
    const data = await res.json();
    let prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);
    
    console.log("🟩 [CATALOGO] Prodotti ricevuti:", prodotti.length);
    window.prodottiOriginali = prodotti; // Backup fondamentale per filtri e reset
    return prodotti;
  } catch (err) {
    console.error("🔥 [CATALOGO] Errore fetch prodotti:", err);
    return [];
  }
}

/* 2) UTILITY FORMATTAZIONE */
function clean(t) {
  return typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";
}

function getImage(p) {
  const url = p.immagine || p.immagine_url || "";
  return (typeof url === "string" && url.startsWith("http")) ? url : "/placeholder.webp";
}

/* 3) CARD PRODOTTO (HTML) */
function cardHTML(p) {
  if (!p || !p.id) return "";

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = getImage(p);
  
  let pMostrato = "0.00";
  let pCent = 0;

  if (p.prezzo_cent) {
      pCent = Number(p.prezzo_cent);
      pMostrato = (pCent / 100).toFixed(2);
  } else if (p.prezzo) {
      pMostrato = Number(p.prezzo).toFixed(2);
      pCent = Math.round(pMostrato * 100);
  }

  const desc = clean(p.descrizione_breve || p.descrizione || "");
  
  // Normalizzazione categorie per il data-attribute
  let catArray = [];
  if (Array.isArray(p.categoria)) catArray = p.categoria;
  else if (p.categoria) catArray = p.categoria.split(',').map(c => c.trim());
  const catsAttr = catArray.map(clean).join(" ");

  return `
    <div class="product-card" data-cat="${catsAttr}" data-id="${id}">
      <img src="${img}" alt="${titolo}" loading="lazy">
      <h2>${titolo}</h2>
      <p>${desc}</p>
      <p class="prezzo">€${pMostrato}</p>
      <div class="card-buttons">
        <a href="prodotto.html?id=${id}" class="btn">Dettagli</a>
        <button class="btn-secondario btn-add-cart" 
          data-id="${id}" data-title="${titolo}" 
          data-price-cent="${pCent}" data-img="${img}">
          🛒 Aggiungi
        </button>
      </div>
    </div>`;
}

/* 4) LOGICA CORE & GENERAZIONE CATEGORIE */
async function avviaCatalogo(prodottiDaMostrare = null) {
  const container = document.getElementById("catalogo");
  if (!container) return;

  const products = prodottiDaMostrare || await loadProducts();

  if (!products.length) {
    container.innerHTML = `<p>Nessun prodotto trovato per questa selezione.</p>`;
    return;
  }

  // Render dei prodotti
  let html = "";
  products.forEach((p) => {
    try { html += cardHTML(p); } catch (e) {}
  });
  container.innerHTML = html;

  // Gestione Categorie: le estraiamo dai prodotti solo al primo caricamento
  const catBox = document.getElementById("categorie");
  if (catBox && !prodottiDaMostrare) {
    const tutteLeCat = window.prodottiOriginali.flatMap(p => {
      if (Array.isArray(p.categoria)) return p.categoria;
      if (typeof p.categoria === 'string') return p.categoria.split(',').map(c => c.trim());
      return [];
    });

    const categorieUniche = [...new Set(tutteLeCat)].filter(c => c !== "");

    let htmlBottoni = `<button class="btn btn-cat active" data-cat="all">Tutti</button>`;
    htmlBottoni += categorieUniche.map(c => `
      <button class="btn btn-cat" data-cat="${clean(c)}">${clean(c)}</button>
    `).join("");

    catBox.innerHTML = htmlBottoni;
  }
}

/* 5) GESTIONE EVENTI (Filtri Prezzo, Categorie & Carrello) */
function inizializzaListeners() {
  // FILTRI PREZZO
  document.querySelectorAll(".filtri-prezzo .btn[data-prezzo]").forEach(btn => {
    btn.onclick = () => {
      const soglia = parseFloat(btn.dataset.prezzo);
      const filtrati = window.prodottiOriginali.filter(p => {
        const prezzo = p.prezzo_cent ? (p.prezzo_cent / 100) : (Number(p.prezzo) || 0);
        return prezzo <= soglia;
      });
      avviaCatalogo(filtrati);
    };
  });

  // RESET
  const btnReset = document.getElementById("reset");
  if (btnReset) btnReset.onclick = () => avviaCatalogo(window.prodottiOriginali);

  // CLICK CATEGORIE (Filtro Reale)
  const catBox = document.getElementById("categorie");
  if (catBox) {
    catBox.onclick = (e) => {
      const btn = e.target.closest(".btn-cat");
      if (!btn) return;

      document.querySelectorAll(".btn-cat").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const scelta = btn.dataset.cat;
      if (scelta === "all") {
        avviaCatalogo(window.prodottiOriginali);
      } else {
        const filtrati = window.prodottiOriginali.filter(p => {
          const pCats = Array.isArray(p.categoria) ? p.categoria : (p.categoria || "").split(',').map(c => c.trim());
          return pCats.includes(scelta);
        });
        avviaCatalogo(filtrati);
      }
    };
  }

  // AGGIUNTA CARRELLO
  document.getElementById("catalogo").onclick = (e) => {
    const btn = e.target.closest(".btn-add-cart");
    if (!btn) return;
    const prod = { 
      id: btn.dataset.id, titolo: btn.dataset.title, 
      prezzo_cent: Number(btn.dataset.priceCent), immagine: btn.dataset.img 
    };
    if (window.aggiungiAlCarrello) {
      window.aggiungiAlCarrello(prod);
      if (window.aggiornaBadgeCarrello) window.aggiornaBadgeCarrello();
    }
  };
}

/* 6) BOOTSTRAP */
async function bootstrap() {
  if (window.__started) return;
  window.__started = true;
  await avviaCatalogo();
  inizializzaListeners();
}

window.renderProdotti = avviaCatalogo;
document.addEventListener("DOMContentLoaded", bootstrap);
if (window.fetchUniversale) bootstrap();
setTimeout(bootstrap, 1200); // Fail-safe per loader asincroni
