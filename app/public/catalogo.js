// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH 2027.300
// - Usa fetchCritico globale + apiFetch alias
// - Rimosso dominio hardcoded
// - Avvio sincronizzato con critical-ready
// =========================================================

/* =========================================================
   1) CARICA PRODOTTI DAL BACKEND (PATCH: alias universale)
========================================================= */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");

  try {
    // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias /products
    const res = await window.fetchCritico(
      "/products",
      { cache: "no-store" },
      { retries: 3, backoffMs: 400 }
    );

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
   2) CARICA CATEGORIE (PATCH: fetchCritico)
========================================================= */
async function loadCategories() {
  try {
    const res = await window.fetchCritico(
      "/data/categories.json",
      { cache: "no-store" },
      { retries: 2, backoffMs: 200 }
    );

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
   8) INIZIALIZZAZIONE CATALOGO (PATCH: critical-ready)
========================================================= */
document.addEventListener("critical-ready", async () => {

  console.log("🟦 [CATALOGO] critical-ready");

  const products = await loadProducts();
  const categoriesFromJson = await loadCategories();

  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  if (!container || !categorieBox) {
    console.error("❌ [CATALOGO] container o categorieBox non trovati");
    return;
  }

  if (!products.length) {
    container.innerHTML = `
      <p class="errore-catalogo">
        Nessun prodotto disponibile.  
        <br>Se il problema persiste, controlla la connessione o riprova più tardi.
      </p>`;
    return;
  }

  let categorie = categoriesFromJson.length
    ? categoriesFromJson
    : [...new Set(products.flatMap(p => Array.isArray(p.categoria) ? p.categoria : []))];

  categorieBox.innerHTML = categorie.length
    ? categorie.map(cat => `<button class="btn btn-cat" data-cat="${clean(cat)}">${clean(cat)}</button>`).join("")
    : "<p>Nessuna categoria disponibile</p>";

  container.innerHTML = products.map(cardHTML).join("");

  categorieBox.addEventListener("click", e => {
    const cat = e.target.dataset.cat;
    if (!cat) return;

    document.querySelectorAll(".product-card").forEach(card => {
      const cats = card.dataset.cat.split(" ");
      card.style.display = cats.includes(cat) ? "block" : "none";
    });
  });

  document.querySelectorAll(".filtri-prezzo .btn[data-prezzo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const max = Number(btn.dataset.prezzo);

      document.querySelectorAll(".product-card").forEach(card => {
        const prezzo = Number(card.dataset.prezzo);
        card.style.display = prezzo <= max ? "block" : "none";
      });
    });
  });

  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = "block";
      });
    });
  }

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

  setTimeout(() => {
    if (typeof aggiornaBadgeCarrello === "function") {
      aggiornaBadgeCarrello();
    }
  }, 50);
});
