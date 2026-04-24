// =========================================================
// CATALOGO PREMIUM – MewingMarket
// Versione SQL definitiva + PATCH NUCLEARE 2027
// Full Logic: Categorie, Prezzi, Aggiungi & Rimuovi
// =========================================================

/* 1) CARICA PRODOTTI */
async function loadProducts() {
  console.log("🟦 [CATALOGO] Caricamento prodotti…");
  try {
    const res = await window.fetchUniversale("/products", { cache: "no-store" });
    const data = await res.json();
    let prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);
    window.prodottiOriginali = prodotti; 
    return prodotti;
  } catch (err) {
    console.error("🔥 [CATALOGO] Errore fetch:", err);
    return [];
  }
}

/* 2) UTILITY FORMATTAZIONE */
function clean(t) {
  return typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";
}

function getImage(p) {
  const url = p.immagine || p.immagine_url || "";
  return (typeof url === "string" && url.startsWith("http")) ? url : "/placeholder.webp";
}

/* 3) CARD PRODOTTO (HTML) */
function cardHTML(p) {
  if (!p || !p.id) return "";

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = getImage(p);
  
  let pMostrato = "0.00", pCent = 0;
  if (p.prezzo_cent) {
      pCent = Number(p.prezzo_cent);
      pMostrato = (pCent / 100).toFixed(2);
  } else if (p.prezzo) {
      pMostrato = Number(p.prezzo).toFixed(2);
      pCent = Math.round(pMostrato * 100);
  }

  const desc = clean(p.descrizione_breve || p.descrizione || "");
  let catArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? p.categoria.split(',') : []);
  const catsAttr = catArray.map(c => clean(c.trim())).join(" ");

  return `
    <div class="product-card" data-cat="${catsAttr}" data-id="${id}">
      <img src="${img}" alt="${titolo}" loading="lazy">
      <h2>${titolo}</h2>
      <p>${desc}</p>
      <p class="prezzo">€${pMostrato}</p>
      <div class="card-buttons">
        <a href="prodotto.html?id=${id}" class="btn">Dettagli</a>
        <div class="cart-controls">
          <button class="btn-secondario btn-add-cart" 
            data-id="${id}" data-title="${titolo}" 
            data-price-cent="${pCent}" data-img="${img}">
            🛒 +
          </button>
          <button class="btn-remove-cart" data-id="${id}" title="Rimuovi">
            🗑️
          </button>
        </div>
      </div>
    </div>`;
}

/* 4) LOGICA CORE & GENERAZIONE CATEGORIE */
async function avviaCatalogo(prodottiDaMostrare = null) {
  const container = document.getElementById("catalogo");
  if (!container) return;

  const products = prodottiDaMostrare || await loadProducts();
  container.innerHTML = products.length ? products.map(p => cardHTML(p)).join("") : `<p>Nessun prodotto trovato.</p>`;

  const catBox = document.getElementById("categorie");
  if (catBox && !prodottiDaMostrare) {
    const tutteLeCat = window.prodottiOriginali.flatMap(p => 
      Array.isArray(p.categoria) ? p.categoria : (p.categoria ? p.categoria.split(',') : [])
    );
    const categorieUniche = [...new Set(tutteLeCat.map(c => c.trim()))].filter(c => c !== "");

    catBox.innerHTML = `<button class="btn btn-cat active" data-cat="all">Tutti</button>` + 
      categorieUniche.map(c => `<button class="btn btn-cat" data-cat="${clean(c)}">${clean(c)}</button>`).join("");
  }
}

/* 5) GESTIONE EVENTI (Filtri & Carrello) */
function inizializzaListeners() {
  // FILTRI PREZZO
  document.querySelectorAll(".filtri-prezzo .btn[data-prezzo]").forEach(btn => {
    btn.onclick = () => {
      const soglia = parseFloat(btn.dataset.prezzo);
      avviaCatalogo(window.prodottiOriginali.filter(p => (p.prezzo_cent ? p.prezzo_cent/100 : p.prezzo) <= soglia));
    };
  });

  // RESET
  const br = document.getElementById("reset");
  if (br) br.onclick = () => avviaCatalogo(window.prodottiOriginali);

  // CLICK CATEGORIE
  const cb = document.getElementById("categorie");
  if (cb) {
    cb.onclick = (e) => {
      const b = e.target.closest(".btn-cat");
      if (!b) return;
      document.querySelectorAll(".btn-cat").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const s = b.dataset.cat;
      avviaCatalogo(s === "all" ? window.prodottiOriginali : window.prodottiOriginali.filter(p => 
        (Array.isArray(p.categoria) ? p.categoria : (p.categoria || "").split(',')).map(c => c.trim()).includes(s)
      ));
    };
  }

  // AGGIUNTA E RIMOZIONE CARRELLO (Delegated)
  document.getElementById("catalogo").onclick = (e) => {
    // Gestione AGGIUNGI
    const btnAdd = e.target.closest(".btn-add-cart");
    if (btnAdd) {
      const p = { id: btnAdd.dataset.id, titolo: btnAdd.dataset.title, prezzo_cent: Number(btnAdd.dataset.priceCent), immagine: btnAdd.dataset.img };
      if (window.aggiungiAlCarrello) {
        window.aggiungiAlCarrello(p);
        if (window.aggiornaBadgeCarrello) window.aggiornaBadgeCarrello();
      }
      return;
    }

    // Gestione RIMUOVI [NOVITÀ]
    const btnRem = e.target.closest(".btn-remove-cart");
    if (btnRem) {
      const id = btnRem.dataset.id;
      if (window.rimuoviDalCarrello) {
        window.rimuoviDalCarrello(id);
        if (window.aggiornaBadgeCarrello) window.aggiornaBadgeCarrello();
        console.log("🗑️ Prodotto rimosso ID:", id);
      }
    }
  };
}

/* 6) BOOTSTRAP */
async function bootstrap() {
  if (window.__started) return;
  window.__started = true;
  await avviaCatalogo();
  inizializzaListeners();
}

document.addEventListener("DOMContentLoaded", bootstrap);
setTimeout(bootstrap, 1200);
