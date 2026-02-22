// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione: Model A + Carrello + Badge + Login Check
// =========================================================

// ------------------------------
// 1) Carica prodotti dal backend
// ------------------------------
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

// ------------------------------
// 2) Sanitizzazione
// ------------------------------
function clean(t) {
  return typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";
}

function safeURL(u) {
  return typeof u === "string" && u.startsWith("http") ? u : "";
}

// ------------------------------
// 3) Video YouTube
// ------------------------------
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

// ------------------------------
// 4) Descrizione breve
// ------------------------------
function getShortDescription(p) {
  // Se Airtable un giorno fornisse una descrizione breve, la useremmo
  if (p.descrizione_breve && p.descrizione_breve.trim() !== "") {
    return clean(p.descrizione_breve);
  }

  // Generazione automatica da descrizione lunga
  const full = p.descrizione || "";
  const short = full.length > 120 ? full.slice(0, 120) + "…" : full;

  return clean(short);
}

// ------------------------------
// 5) Immagine
// ------------------------------
function getImage(p) {
  if (p.immagine && p.immagine.startsWith("http")) {
    return p.immagine;
  }
  return "/placeholder.webp";
}

// ------------------------------
// 6) Card prodotto (VERSIONE PREMIUM)
// ------------------------------
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

// ------------------------------
// 7) Inizializzazione catalogo
// ------------------------------
(async function initCatalogo() {
  const products = await loadProducts();
  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container || !categorieBox) return;

  // ---------------------------
  // CATEGORIE DINAMICHE
  // ---------------------------
  const categorie = [...new Set(products.map(p => p.categoria || ""))].filter(Boolean);

  categorieBox.innerHTML = categorie.length
    ? categorie.map(cat => `<button class="btn" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("")
    : "<p>Nessuna categoria disponibile</p>";

  // ---------------------------
  // GRID PRODOTTI
  // ---------------------------
  container.innerHTML = products.length
    ? products.map(cardHTML).join("")
    : "<p>Nessun prodotto disponibile.</p>";

  // ---------------------------
  // FILTRO CATEGORIA
  // ---------------------------
  categorieBox.addEventListener("click", e => {
    const cat = e.target.dataset.cat;
    if (!cat) return;

    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = card.dataset.cat === cat ? "block" : "none";
    });
  });

  // ---------------------------
  // FILTRO PREZZO
  // ---------------------------
  document.querySelectorAll("[data-prezzo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const max = Number(btn.dataset.prezzo);

      document.querySelectorAll(".product-card").forEach(card => {
        const prezzo = Number(card.dataset.prezzo);
        card.style.display = prezzo <= max ? "block" : "none";
      });
    });
  });

  // ---------------------------
  // RESET FILTRI
  // ---------------------------
  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = "block";
      });
    });
  }

  // ---------------------------
  // AGGIUNTA AL CARRELLO
  // ---------------------------
  document.querySelectorAll(".btn-add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const session = localStorage.getItem("session");

      // MODEL A → solo utenti registrati
      if (!session) {
        window.location.href = "login.html";
        return;
      }

      const prodotto = {
        slug: btn.dataset.slug,
        titolo: btn.dataset.title,
        prezzo: Number(btn.dataset.price),
        immagine: btn.dataset.img
      };

      aggiungiAlCarrello(prodotto);
      aggiornaBadgeCarrello();
    });
  });

  // Aggiorna badge all’avvio
  if (typeof aggiornaBadgeCarrello === "function") {
    aggiornaBadgeCarrello();
  }
})();
