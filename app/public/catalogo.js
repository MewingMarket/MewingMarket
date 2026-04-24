// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH NUCLEARE 2027
// =========================================================

/* 1) CARICA PRODOTTI (Flessibile) */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");
  try {
    const res = await window.fetchUniversale("/products", { cache: "no-store" });
    const data = await res.json();
    let prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);
    
    console.log("🟩 [CATALOGO] Prodotti ricevuti:", prodotti.length);
    window.prodottiOriginali = prodotti; // Backup per i filtri prezzo
    return prodotti;
  } catch (err) {
    console.error("🔥 [CATALOGO] Errore fetch prodotti:", err);
    return [];
  }
}

/* 2) CARICA CATEGORIE */
async function loadCategories() {
  try {
    const res = await window.fetchUniversale("/categories", { cache: "no-store" });
    const cats = await res.json();
    return Array.isArray(cats) ? cats : [];
  } catch (err) {
    console.warn("⚠️ [CATALOGO] Categorie non disponibili.");
    return [];
  }
}

/* 3) UTILITY FORMATTAZIONE */
function clean(t) {
  return typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";
}

function getImage(p) {
  const url = p.immagine || p.immagine_url || "";
  return (typeof url === "string" && url.startsWith("http")) ? url : "/placeholder.webp";
}

/* 4) CARD PRODOTTO (HTML) */
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
  const cats = Array.isArray(p.categoria) ? p.categoria.join(" ") : clean(p.categoria || "");

  return `
    <div class="product-card" data-cat="${cats}" data-id="${id}">
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

/* 5) LOGICA CORE & FILTRI */
async function avviaCatalogo(prodottiDaMostrare = null) {
  const container = document.getElementById("catalogo");
  if (!container) return;

  const products = prodottiDaMostrare || await loadProducts();

  if (!products.length) {
    container.innerHTML = `<p>Nessun prodotto disponibile.</p>`;
    return;
  }

  let html = "";
  products.forEach((p) => {
    try { html += cardHTML(p); } catch (e) {}
  });
  container.innerHTML = html;

  // Inizializza Categorie (solo al primo avvio se non prodottiDaMostrare)
  if (!prodottiDaMostrare) {
    const categories = await loadCategories();
    const catBox = document.getElementById("categorie");
    if (catBox) {
      const listaCat = categories.length ? categories : [...new Set(products.flatMap(p => p.categoria || []))];
      catBox.innerHTML = listaCat.map(c => `<button class="btn btn-cat" data-cat="${clean(c)}">${clean(c)}</button>`).join("");
    }
  }
}

/* 6) GESTIONE EVENTI (Filtri & Carrello) */
function inizializzaListeners() {
  // Filtri Prezzo (Bottoni Fino a 10€, 20€, ecc)
  document.querySelectorAll(".filtri-prezzo .btn[data-prezzo]").forEach(btn => {
    btn.onclick = () => {
      const soglia = parseFloat(btn.dataset.prezzo);
      const filtrati = window.prodottiOriginali.filter(p => {
        const prezzo = p.prezzo_cent ? (p.prezzo_cent / 100) : (p.prezzo || 0);
        return prezzo <= soglia;
      });
      avviaCatalogo(filtrati);
    };
  });

  // Reset
  const btnReset = document.getElementById("reset");
  if (btnReset) btnReset.onclick = () => avviaCatalogo(window.prodottiOriginali);

  // Click Categorie
  const catBox = document.getElementById("categorie");
  if (catBox) {
    catBox.onclick = (e) => {
      const cat = e.target.dataset.cat;
      if (!cat) return;
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = (card.dataset.cat.includes(cat)) ? "block" : "none";
      });
    };
  }

  // Aggiunta al Carrello
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

/* 7) BOOTSTRAP */
async function bootstrap() {
  if (window.__started) return;
  window.__started = true;
  await avviaCatalogo();
  inizializzaListeners();
}

window.renderProdotti = avviaCatalogo;
document.addEventListener("DOMContentLoaded", bootstrap);
if (window.fetchUniversale) bootstrap();
setTimeout(bootstrap, 1500);
