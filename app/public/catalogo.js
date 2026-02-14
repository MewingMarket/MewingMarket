// catalogo.js — versione corretta e allineata ad Airtable

/* =========================================================
   CARICAMENTO PRODOTTI
========================================================= */
async function loadProducts() {
  try {
    const res = await fetch("products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Errore fetch products.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    return [];
  }
}

/* =========================================================
   SANITIZZAZIONE
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
   VIDEO YOUTUBE
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
   CARD PRODOTTO
========================================================= */
function cardHTML(p) {
  const img = p.Immagine?.[0]?.url || "img/placeholder.webp";
  const titolo = clean(p.Titolo || "");
  const descrizione = clean(p.DescrizioneLunga || "");
  const prezzo = Number(p.Prezzo) || 0;
  const slug = clean(p.slug || "");

  return `
    <div class="product-card" data-cat="${clean(p.Categoria || "")}" data-prezzo="${prezzo}">
      <img src="${img}" alt="${titolo}" loading="lazy">
      <h2>${titolo}</h2>
      <p>${descrizione}</p>
      <p class="prezzo">€${prezzo}</p>
      ${renderYouTubeLink(p)}
      <a href="prodotto.html?slug=${slug}" class="btn">Scopri di più</a>
    </div>
  `;
}

/* =========================================================
   INIZIALIZZAZIONE CATALOGO
========================================================= */
(async function initCatalogo() {
  const products = await loadProducts();
  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container || !categorieBox) {
    console.error("catalogo.js: elementi mancanti");
    return;
  }

  /* ----------------------------
     CATEGORIE DINAMICHE
  ----------------------------- */
  const categorie = [...new Set(products.map(p => p.Categoria))].filter(Boolean);

  categorieBox.innerHTML = categorie.length
    ? categorie.map(cat => `<button class="btn" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("")
    : "<p>Nessuna categoria disponibile</p>";

  /* ----------------------------
     POPOLA CATALOGO
  ----------------------------- */
  container.innerHTML = products.length
    ? products.map(cardHTML).join("")
    : "<p>Nessun prodotto disponibile.</p>";

  /* ----------------------------
     FILTRO CATEGORIA
  ----------------------------- */
  categorieBox.addEventListener("click", e => {
    const cat = e.target.dataset.cat;
    if (!cat) return;

    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = card.dataset.cat === cat ? "block" : "none";
    });
  });

  /* ----------------------------
     FILTRO PREZZO
  ----------------------------- */
  document.querySelectorAll("[data-prezzo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const max = parseFloat(btn.dataset.prezzo);
      if (isNaN(max)) return;

      document.querySelectorAll(".product-card").forEach(card => {
        const prezzo = parseFloat(card.dataset.prezzo);
        card.style.display = prezzo <= max ? "block" : "none";
      });
    });
  });

  /* ----------------------------
     RESET FILTRI
  ----------------------------- */
  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = "block";
      });
    });
  }
})();
