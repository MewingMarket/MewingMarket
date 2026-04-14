// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva: Categorie JSON + Filtri + Carrello Guest (ID-based)
// Patch 2026.960 — Dominio .IT + Diagnostica + Anti-sito-vuoto
// =========================================================

/* =========================================================
   0) CONFIG BACKEND (DOMINIO .IT)
========================================================= */
const API_BASE = "https://www.mewingmarket.it";
const API_PRODUCTS = API_BASE + "/api/products";

/* =========================================================
   1) CARICA PRODOTTI DAL BACKEND
========================================================= */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");

  try {
    const res = await fetch(API_PRODUCTS, { cache: "no-store" });

    console.log("🟩 [CORS] Allow-Origin:", res.headers.get("Access-Control-Allow-Origin"));

    if (!res.ok) {
      console.error("❌ [CATALOGO] Risposta non OK:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();

    if (!data || !data.success || !Array.isArray(data.prodotti)) {
      console.error("❌ [CATALOGO] Formato dati non valido:", data);
      return [];
    }

    console.log("🟩 [CATALOGO] Prodotti ricevuti:", data.prodotti.length);
    return data.prodotti;

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
    const res = await fetch("/data/categories.json", { cache: "no-store" });
    if (!res.ok) throw new Error("categories.json non trovato");
    const cats = await res.json();
    return Array.isArray(cats) ? cats : [];
  } catch (err) {
    console.warn("⚠️ [CATALOGO] Categorie JSON non disponibili:", err);
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
  const url = safeURL(p.youtube_url);
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
  if (p.descrizione_breve) return clean(p.descrizione_breve);
  const full = p.descrizione_lunga || "";
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
  const titoloBreve = clean(p.titolo_breve || p.titolo || "");
  const descrizione = getShortDescription(p);

  const prezzo_cent = Number(p.prezzo_cent) || 0;
  const prezzo = prezzo_cent / 100;

  const categorie = Array.isArray(p.categoria) ? p.categoria : [];
  const categorieAttr = categorie.map(clean).join(" ");

  const id = p.id;

  return `
    <div class="product-card" data-cat="${categorieAttr}" data-prezzo="${prezzo}" data-id="${id}">
      <img src="${img}" alt="${titoloBreve}" loading="lazy">
      <h2>${titoloBreve}</h2>
      <p>${descrizione}</p>
      <p class="prezzo">€${prezzo}</p>

      ${renderYouTubeLink(p)}

      <div class="card-buttons">
        <a href="prodotto.html?id=${encodeURIComponent(id)}" class="btn">Scopri di più</a>

        <button class="btn-secondario btn-add-cart" 
          data-id="${id}"
          data-title="${titoloBreve}" 
          data-price-cent="${prezzo_cent}"
          data-img="${img}">
          Aggiungi al carrello
        </button>

        <button class="btn-secondario btn-remove-cart"
          data-id="${id}">
          Rimuovi dal carrello
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
   8) INIZIALIZZAZIONE CATALOGO
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {

  console.log("🟦 [CATALOGO] DOMContentLoaded");

  const products = await loadProducts();
  const categoriesFromJson = await loadCategories();

  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container || !categorieBox) {
    console.error("❌ [CATALOGO] container o categorieBox non trovati");
    return;
  }

  /* ------------------------------
     FAIL-SAFE: nessun prodotto
  ------------------------------ */
  if (!products.length) {
    container.innerHTML = `
      <p class="errore-catalogo">
        Nessun prodotto disponibile.  
        <br>Se il problema persiste, controlla la connessione o riprova più tardi.
      </p>`;
    return;
  }

  /* ------------------------------
     CATEGORIE DINAMICHE
  ------------------------------ */
  let categorie = categoriesFromJson.length
    ? categoriesFromJson
    : [...new Set(products.flatMap(p => Array.isArray(p.categoria) ? p.categoria : []))];

  categorieBox.innerHTML = categorie.length
    ? categorie.map(cat => `<button class="btn btn-cat" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("")
    : "<p>Nessuna categoria disponibile</p>";

  /* ------------------------------
     GRID PRODOTTI
  ------------------------------ */
  container.innerHTML = products.map(cardHTML).join("");

  /* ------------------------------
     FILTRO CATEGORIA
  ------------------------------ */
  categorieBox.addEventListener("click", e => {
    const cat = e.target.dataset.cat;
    if (!cat) return;

    document.querySelectorAll(".product-card").forEach(card => {
      const cats = card.dataset.cat.split(" ");
      card.style.display = cats.includes(cat) ? "block" : "none";
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
     AGGIUNTA / RIMOZIONE CARRELLO
  ------------------------------ */
  document.querySelectorAll(".btn-add-cart").forEach(btn => {
    btn.addEventListener("click", () => {

      const prodotto = {
        id: Number(btn.dataset.id),
        titolo: btn.dataset.title,
        prezzo_cent: Number(btn.dataset.priceCent),
        prezzo: Number(btn.dataset.priceCent) / 100,
        immagine: btn.dataset.img
      };

      if (typeof aggiungiAlCarrello === "function") {
        aggiungiAlCarrello(prodotto);
      }

      if (typeof aggiornaBadgeCarrello === "function") {
        aggiornaBadgeCarrello();
      }

      if (typeof isLogged === "function" && !isLogged()) {
        alert("Per completare l'acquisto dovrai fare login in checkout.");
      }
    });
  });

  document.querySelectorAll(".btn-remove-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);

      if (typeof rimuoviDalCarrello === "function") {
        rimuoviDalCarrello(id);
      }

      if (typeof aggiornaBadgeCarrello === "function") {
        aggiornaBadgeCarrello();
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
