// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH ANTI-CRASH 2027
// BOOTSTRAP AGGRESSIVO INTEGRATO
// =========================================================

/* =========================================================
   1) CARICA PRODOTTI
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
    console.warn("⚠️ [CATALOGO] Categorie non disponibili:", err);
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
  if (p.immagine && p.immagine.startsWith("http")) return p.immagine;
  if (p.immagine_url && p.immagine_url.startsWith("http")) return p.immagine_url;
  return "/placeholder.webp";
}

/* =========================================================
   4) CARD PRODOTTO (HTML)
========================================================= */
function cardHTML(p) {
  // Se il prodotto è malformato, generiamo un errore intercettabile dal ciclo
  if (!p || !p.id) throw new Error("Dati prodotto mancanti o ID assente");

  const img = getImage(p);
  const titoloBreve = clean(p.titolo_breve || p.titolo || "Prodotto");
  const descrizione = p.descrizione_breve ? clean(p.descrizione_breve) : "";
  const prezzo_cent = Number(p.prezzo_cent) || 0;
  const prezzo = (prezzo_cent / 100).toFixed(2);
  const categorie = Array.isArray(p.categoria) ? p.categoria : [];
  const categorieAttr = categorie.map(clean).join(" ");
  const id = p.id;

  return `
    <div class="product-card" data-cat="${categorieAttr}" data-prezzo="${prezzo}" data-id="${id}">
      <img src="${img}" alt="${titoloBreve}" loading="lazy">
      <h2>${titoloBreve}</h2>
      <p>${descrizione}</p>
      <p class="prezzo">€${prezzo}</p>
      <div class="card-buttons">
        <a href="prodotto.html?id=${encodeURIComponent(id)}" class="btn">Dettagli</a>
        <button class="btn-secondario btn-add-cart" 
          data-id="${id}"
          data-title="${titoloBreve}" 
          data-price-cent="${prezzo_cent}"
          data-img="${img}">
          🛒 Aggiungi
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
   5) LOGICA CORE - PATCHATA (ANTI "CAPA DURA")
========================================================= */
async function avviaCatalogo() {
  console.log("🟦 [CATALOGO] Esecuzione avviaCatalogo()");

  const container = document.getElementById("catalogo");
  if (!container) return;

  const products = await loadProducts();
  const categoriesFromJson = await loadCategories();

  if (!products.length) {
    container.innerHTML = `<p>Nessun prodotto trovato.</p>`;
    return;
  }

  // --- INIZIO PATCH ANTI-CRASH ---
  let htmlAccumulato = "";
  products.forEach((p, index) => {
    try {
      // Proviamo a generare il pezzetto di codice per ogni prodotto
      htmlAccumulato += cardHTML(p);
    } catch (err) {
      // Se un prodotto fallisce (es. dati null), logghiamo ma non fermiamo gli altri
      console.error(`⚠️ Errore al prodotto index ${index}:`, err);
    }
  });

  // Scriviamo nel DOM solo alla fine
  container.innerHTML = htmlAccumulato || "<h2>Errore nel rendering dei prodotti</h2>";
  // --- FINE PATCH ---

  // Gestione Categorie
  const categorieBox = document.getElementById("categorie");
  if (categorieBox) {
    let categorie = categoriesFromJson.length ? categoriesFromJson : [...new Set(products.flatMap(p => Array.isArray(p.categoria) ? p.categoria : []))];
    categorieBox.innerHTML = categorie.map(cat => `<button class="btn btn-cat" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("");
    categorieBox.addEventListener("click", e => {
      const cat = e.target.dataset.cat;
      if (!cat) return;
      document.querySelectorAll(".product-card").forEach(card => {
        const cats = card.dataset.cat.split(" ");
        card.style.display = cats.includes(cat) ? "block" : "none";
      });
    });
  }

  // Eventi Carrello
  container.addEventListener("click", e => {
    const btn = e.target.closest(".btn-add-cart");
    if (!btn) return;
    const prodotto = { id: Number(btn.dataset.id), titolo: btn.dataset.title, prezzo_cent: Number(btn.dataset.priceCent), immagine: btn.dataset.img };
    if (typeof window.aggiungiAlCarrello === "function") {
      window.aggiungiAlCarrello(prodotto);
      if (typeof window.aggiornaBadgeCarrello === "function") window.aggiornaBadgeCarrello();
    }
  });
  
  console.log("🎨 [CATALOGO] Render completato con successo.");
}

/* =========================================================
   6) BOOTSTRAP
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
