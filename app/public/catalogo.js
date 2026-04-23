// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH 2027.902 + BOOTSTRAP AGGRESSIVO
// =========================================================

/* =========================================================
   1) CARICA PRODOTTI (compatibile con TUTTI i formati)
========================================================= */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");

  try {
    // Utilizza il fetchUniversale iniettato da mm-api.js
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
    } else {
      console.error("❌ [CATALOGO] Formato dati non valido:", data);
      return [];
    }

    console.log("🟩 [CATALOGO] Prodotti ricevuti:", prodotti.length);
    // Salviamo in window per debug e per altri componenti
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
  return typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";
}

function safeURL(u) {
  return typeof u === "string" && u.startsWith("http") ? u : "";
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

      ${p.youtube_url ? `
        <div class="video-link">
          <a href="${safeURL(p.youtube_url)}" target="_blank">🎥 Video Prodotto</a>
        </div>` : ""}

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
   5) LOGICA CORE DEL CATALOGO
========================================================= */
async function avviaCatalogo() {
  console.log("🟦 [CATALOGO] Esecuzione avviaCatalogo()");

  const products = await loadProducts();
  const categoriesFromJson = await loadCategories();

  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container) {
    console.warn("⚠️ [CATALOGO] Elemento #catalogo non trovato nel DOM");
    return;
  }

  if (!products.length) {
    container.innerHTML = `<p class="errore-catalogo">Nessun prodotto trovato.</p>`;
    return;
  }

  // Gestione Categorie
  if (categorieBox) {
    let categorie = categoriesFromJson.length
      ? categoriesFromJson
      : [...new Set(products.flatMap(p => Array.isArray(p.categoria) ? p.categoria : []))];

    categorieBox.innerHTML = categorie.map(cat => 
      `<button class="btn btn-cat" data-cat="${clean(cat)}">${clean(cat)}</button>`
    ).join("");

    categorieBox.addEventListener("click", e => {
      const cat = e.target.dataset.cat;
      if (!cat) return;
      document.querySelectorAll(".product-card").forEach(card => {
        const cats = card.dataset.cat.split(" ");
        card.style.display = cats.includes(cat) ? "block" : "none";
      });
    });
  }

  // Render Card
  container.innerHTML = products.map(cardHTML).join("");

  // Eventi Carrello
  container.addEventListener("click", e => {
    const btn = e.target.closest(".btn-add-cart");
    if (!btn) return;

    const prodotto = {
      id: Number(btn.dataset.id),
      titolo: btn.dataset.title,
      prezzo_cent: Number(btn.dataset.priceCent),
      immagine: btn.dataset.img
    };

    if (typeof window.aggiungiAlCarrello === "function") {
      window.aggiungiAlCarrello(prodotto);
      if (typeof window.aggiornaBadgeCarrello === "function") window.aggiornaBadgeCarrello();
    } else {
      console.error("❌ Funzione aggiungiAlCarrello non trovata!");
    }
  });
}

/* =========================================================
   6) BOOTSTRAP "SUPER AGGRESSIVO" (Anti-Race Condition)
========================================================= */

// Rendiamo la funzione disponibile globalmente per test manuali in console
window.renderProdotti = avviaCatalogo;

function bootstrapCatalogo() {
  if (window.__catalogoStarted) return;
  
  console.log("🚀 [CATALOGO] Inizializzazione bootstrap...");
  window.__catalogoStarted = true;
  
  if (document.readyState === "complete" || document.readyState === "interactive") {
    avviaCatalogo();
  } else {
    document.addEventListener("DOMContentLoaded", avviaCatalogo);
  }
}

// Innesco 1: mm-api è già pronto
if (window.fetchUniversale) {
  console.log("⚡ [CATALOGO] mm-api rilevato, avvio...");
  bootstrapCatalogo();
}

// Innesco 2: Aspetta il segnale dal Loader
document.addEventListener("critical-ready", () => {
  console.log("🎯 [CATALOGO] Segnale critical-ready ricevuto");
  bootstrapCatalogo();
});

// Innesco 3: Fail-safe (Se nulla accade, forza l'avvio dopo 1.5s)
setTimeout(() => {
  if (!window.__catalogoStarted) {
    console.warn("⚠️ [CATALOGO] Avvio di emergenza (Fail-safe)");
    bootstrapCatalogo();
  }
}, 1500);
