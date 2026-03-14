// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva: Categorie JSON + Filtri + Carrello Guest
// =========================================================

/* =========================================================
   1) CARICA PRODOTTI DAL BACKEND
========================================================= */
async function loadProducts() {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = await res.json();
    return data.success && Array.isArray(data.prodotti) ? data.prodotti : [];
  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    return [];
  }
}

/* =========================================================
   2) CARICA CATEGORIE (categories.json)
========================================================= */
async function loadCategories() {
  try {
    const res = await fetch("/data/categories.json", { cache: "no-store" });
    if (!res.ok) throw new Error("categories.json non trovato");
    const cats = await res.json();
    return Array.isArray(cats) ? cats : [];
  } catch (err) {
    console.warn("Categorie JSON non disponibili:", err);
    return [];
  }
}

/* =========================================================
   3) SANITIZZAZIONE
========================================================= */
function clean(t) {
  return typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";
}

function safeURL(u) {
  return typeof u === "string" && u.startsWith("http") ? u : "";
}

/* =========================================================
   4) VIDEO YOUTUBE
========================================================= */
function renderYouTubeLink(p) {
  const url =
    safeURL(p.youtube_url) ||
    safeURL(p.youtube_last_video_url) ||
    "";

  if (!url) return "";

  return `
    <div class="video-link">
      <a href="${url}" target="_blank" rel="noopener noreferrer">
        🎥 Guarda il video su YouTube
      </a>
    </div>
  `;
}

/* =========================================================
   5) DESCRIZIONE BREVE
========================================================= */
function getShortDescription(p) {
  const full = p.descrizione || "";
  const short = full.length > 120 ? full.slice(0, 120) + "…" : full;
  return clean(short);
}

/* =========================================================
   6) IMMAGINE
========================================================= */
function getImage(p) {
  if (p.immagine && p.immagine.startsWith("http")) {
    return p.immagine;
  }
  return "/placeholder.webp";
}

/* =========================================================
   7) CARD PRODOTTO
========================================================= */
function cardHTML(p) {
  const img = getImage(p);
  const titolo = clean(p.titolo || "");
  const descrizione = getShortDescription(p);
  const prezzo = Number(p.prezzo) || 0;
  const slug = clean(p.slug || "");
  const categoria = clean(p.categoria || "");

  return `
    <div class="product-card" data-cat="${categoria}" data-prezzo="${prezzo}">
      <img src="${img}" alt="${titolo}" loading="lazy">
      <h2>${titolo}</h2>
      <p>${descrizione}</p>
      <p class="prezzo">€${prezzo}</p>

      ${renderYouTubeLink(p)}

      <div class="card-buttons">
        <a href="prodotto.html?slug=${slug}" class="btn">Scopri di più</a>
        <button class="btn-secondario btn-add-cart" 
          data-slug="${slug}" 
          data-title="${titolo}" 
          data-price="${prezzo}" 
          data-img="${img}">
          Aggiungi al carrello
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
   8) INIZIALIZZAZIONE CATALOGO
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  const categoriesFromJson = await loadCategories();

  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container || !categorieBox) return;

  /* ------------------------------
     CATEGORIE DINAMICHE
  ------------------------------ */
  let categorie = categoriesFromJson.length
    ? categoriesFromJson
    : [...new Set(products.map(p => p.categoria || ""))].filter(Boolean);

  categorieBox.innerHTML = categorie.length
    ? categorie.map(cat => `<button class="btn btn-cat" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("")
    : "<p>Nessuna categoria disponibile</p>";

  /* ------------------------------
     GRID PRODOTTI
  ------------------------------ */
  container.innerHTML = products.length
    ? products.map(cardHTML).join("")
    : "<p>Nessun prodotto disponibile.</p>";

  /* ------------------------------
     FILTRO CATEGORIA
  ------------------------------ */
  categorieBox.addEventListener("click", e => {
    const cat = e.target.dataset.cat;
    if (!cat) return;

    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = card.dataset.cat === cat ? "block" : "none";
    });
  });

  /* ------------------------------
     FILTRO PREZZO
  ------------------------------ */
  document.querySelectorAll(".filtri-prezzo .btn[data-prezzo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const max = Number(btn.dataset.prezzo);

      document.querySelectorAll(".product-card").forEach(card => {
        const prezzo = Number(card.dataset.prezzo);
        card.style.display = prezzo <= max ? "block" : "none";
      });
    });
  });

  /* ------------------------------
     RESET FILTRI
  ------------------------------ */
  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = "block";
      });
    });
  }

  /* ------------------------------
     AGGIUNTA AL CARRELLO
  ------------------------------ */
  document.querySelectorAll(".btn-add-cart").forEach(btn => {
    btn.addEventListener("click", () => {

      const prodotto = {
        slug: btn.dataset.slug,
        titolo: btn.dataset.title,
        prezzo: Number(btn.dataset.price),
        immagine: btn.dataset.img
      };

      aggiungiAlCarrello(prodotto);

      if (typeof aggiornaBadgeCarrello === "function") {
        aggiornaBadgeCarrello();
      }

      if (typeof isLogged === "function" && !isLogged()) {
        alert("Per completare l'acquisto dovrai fare login in checkout.");
      }
    });
  });

  /* ------------------------------
     AGGIORNA BADGE ALL’AVVIO
  ------------------------------ */
  setTimeout(() => {
    if (typeof aggiornaBadgeCarrello === "function") {
      aggiornaBadgeCarrello();
    }
  }, 50);
});
