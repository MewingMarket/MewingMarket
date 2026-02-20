// =========================================================
// File: app/public/catalogo.js
// Versione patchata: Airtable + API interne + categorie + filtri
// =========================================================

async function loadProducts() {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = await res.json();
    return data.success && Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    return [];
  }
}

function clean(t) {
  return typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";
}

function safeURL(u) {
  return typeof u === "string" && u.startsWith("http") ? u : "";
}

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

function getShortDescription(p) {
  if (p.descrizione_breve && p.descrizione_breve.trim() !== "") {
    return clean(p.descrizione_breve);
  }

  const full = p.descrizione || "";
  const short = full.length > 120 ? full.slice(0, 120) + "…" : full;

  return clean(short);
}

function getImage(p) {
  if (p.immagine && p.immagine.startsWith("http")) {
    return p.immagine;
  }
  return "/placeholder.webp";
}

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
      <a href="prodotto.html?slug=${slug}" class="btn">Scopri di più</a>
    </div>
  `;
}

(async function initCatalogo() {
  const products = await loadProducts();
  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container || !categorieBox) return;

  // ============================================================
  // CATEGORIE DINAMICHE
  // ============================================================
  const categorie = [...new Set(products.map(p => p.categoria || ""))].filter(Boolean);

  categorieBox.innerHTML = categorie.length
    ? categorie.map(cat => `<button class="btn" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("")
    : "<p>Nessuna categoria disponibile</p>";

  // ============================================================
  // GRID PRODOTTI
  // ============================================================
  container.innerHTML = products.length
    ? products.map(cardHTML).join("")
    : "<p>Nessun prodotto disponibile.</p>";

  // ============================================================
  // FILTRO CATEGORIA
  // ============================================================
  categorieBox.addEventListener("click", e => {
    const cat = e.target.dataset.cat;
    if (!cat) return;

    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = card.dataset.cat === cat ? "block" : "none";
    });
  });

  // ============================================================
  // FILTRO PREZZO
  // ============================================================
  document.querySelectorAll("[data-prezzo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const max = Number(btn.dataset.prezzo);

      document.querySelectorAll(".product-card").forEach(card => {
        const prezzo = Number(card.dataset.prezzo);
        card.style.display = prezzo <= max ? "block" : "none";
      });
    });
  });

  // ============================================================
  // RESET FILTRI
  // ============================================================
  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = "block";
      });
    });
  }
})();
