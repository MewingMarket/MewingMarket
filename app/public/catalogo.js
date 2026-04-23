// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH NUCLEARE 2027
// =========================================================

/* =========================================================
   1) CARICA PRODOTTI (Flessibile)
========================================================= */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");
  try {
    const res = await window.fetchUniversale(
      "/products",
      { cache: "no-store" },
      { retries: 3, backoffMs: 400 }
    );

    const data = await res.json();
    let prodotti = [];

    // Gestione diversi formati di risposta API
    if (Array.isArray(data)) {
      prodotti = data;
    } else if (data && Array.isArray(data.prodotti)) {
      prodotti = data.prodotti;
    } else if (data && Array.isArray(data.data)) {
      prodotti = data.data;
    }

    console.log("🟩 [CATALOGO] Prodotti ricevuti:", prodotti.length);
    window.prodotti = prodotti;
    return prodotti;
  } catch (err) {
    console.error("🔥 [CATALOGO] Errore fetch prodotti:", err);
    return [];
  }
}

/* =========================================================
   2) CARICA CATEGORIE
========================================================= */
async function loadCategories() {
  try {
    const res = await window.fetchUniversale(
      "/categories",
      { cache: "no-store" },
      { retries: 2, backoffMs: 200 }
    );
    const cats = await res.json();
    return Array.isArray(cats) ? cats : [];
  } catch (err) {
    console.warn("⚠️ [CATALOGO] Categorie non disponibili, uso fallback.");
    return [];
  }
}

/* =========================================================
   3) UTILITY DI FORMATTAZIONE
========================================================= */
function clean(t) {
  return typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";
}

function getImage(p) {
  const url = p.immagine || p.immagine_url || "";
  return (typeof url === "string" && url.startsWith("http")) ? url : "/placeholder.webp";
}

/* =========================================================
   4) CARD PRODOTTO (Logica Adattiva Nucleare)
========================================================= */
function cardHTML(p) {
  if (!p || !p.id) return ""; // Salta prodotti corrotti

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = getImage(p);
  
  // Gestione flessibile del prezzo (centisimi o euro diretti)
  let prezzoMostrato = "0.00";
  let prezzoCent = 0;

  if (p.prezzo_cent) {
      prezzoCent = Number(p.prezzo_cent);
      prezzoMostrato = (prezzoCent / 100).toFixed(2);
  } else if (p.prezzo) {
      prezzoMostrato = Number(p.prezzo).toFixed(2);
      prezzoCent = Math.round(prezzoMostrato * 100);
  }

  const descrizione = clean(p.descrizione_breve || p.descrizione || "");
  const categorie = Array.isArray(p.categoria) ? p.categoria : [];
  const categorieAttr = categorie.map(clean).join(" ");

  return `
    <div class="product-card" data-cat="${categorieAttr}" data-id="${id}">
      <img src="${img}" alt="${titolo}" loading="lazy">
      <h2>${titolo}</h2>
      <p>${descrizione}</p>
      <p class="prezzo">€${prezzoMostrato}</p>
      <div class="card-buttons">
        <a href="prodotto.html?id=${encodeURIComponent(id)}" class="btn">Dettagli</a>
        <button class="btn-secondario btn-add-cart" 
          data-id="${id}"
          data-title="${titolo}" 
          data-price-cent="${prezzoCent}"
          data-img="${img}">
          🛒 Aggiungi
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
   5) LOGICA CORE - RENDERING SICURO
========================================================= */
async function avviaCatalogo() {
  console.log("🟦 [CATALOGO] Esecuzione avviaCatalogo()");

  const container = document.getElementById("catalogo");
  if (!container) return;

  const products = await loadProducts();
  const categoriesFromJson = await loadCategories();

  if (!products.length) {
    container.innerHTML = `<p>Nessun prodotto disponibile.</p>`;
    return;
  }

  // Ciclo di rendering con protezione anti-crash
  let htmlAccumulato = "";
  products.forEach((p, index) => {
    try {
      htmlAccumulato += cardHTML(p);
    } catch (err) {
      console.error(`⚠️ Errore al prodotto index ${index}:`, err);
    }
  });

  // Iniezione nel DOM (L'altezza si adatterà automaticamente)
  container.innerHTML = htmlAccumulato || "<h2>Errore nel caricamento prodotti</h2>";
  
  // Gestione Categorie
  const categorieBox = document.getElementById("categorie");
  if (categorieBox) {
    let categorie = categoriesFromJson.length ? categoriesFromJson : [...new Set(products.flatMap(p => Array.isArray(p.categoria) ? p.categoria : []))];
    categorieBox.innerHTML = categorie.map(cat => `<button class="btn btn-cat" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("");
    
    categorieBox.addEventListener("click", e => {
      const cat = e.target.dataset.cat;
      if (!cat) return;
      document.querySelectorAll(".product-card").forEach(card => {
        const cats = (card.dataset.cat || "").split(" ");
        card.style.display = (cat === "all" || cats.includes(cat)) ? "block" : "none";
      });
    });
  }

  // Eventi Carrello
  container.addEventListener("click", e => {
    const btn = e.target.closest(".btn-add-cart");
    if (!btn) return;
    const prodotto = { 
        id: btn.dataset.id, 
        titolo: btn.dataset.title, 
        prezzo_cent: Number(btn.dataset.priceCent), 
        immagine: btn.dataset.img 
    };
    if (typeof window.aggiungiAlCarrello === "function") {
      window.aggiungiAlCarrello(prodotto);
      if (typeof window.aggiornaBadgeCarrello === "function") window.aggiornaBadgeCarrello();
    }
  });
  
  console.log("🎨 [CATALOGO] Render completato.");
}

/* =========================================================
   6) BOOTSTRAP (Sincronizzazione API)
========================================================= */
window.renderProdotti = avviaCatalogo;

function bootstrapCatalogo() {
  if (window.__catalogoStarted) return;
  window.__catalogoStarted = true;
  if (document.readyState === "complete" || document.readyState === "interactive") {
    avviaCatalogo();
  } else {
    document.addEventListener("DOMContentLoaded", avviaCatalogo);
  }
}

if (window.fetchUniversale) bootstrapCatalogo();
document.addEventListener("critical-ready", bootstrapCatalogo);
setTimeout(() => { if (!window.__catalogoStarted) bootstrapCatalogo(); }, 1500);
