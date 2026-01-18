// catalogo.js — blindato

async function loadProducts() {
  const res = await fetch("products.json", { cache: "no-store" });
  return await res.json();
}

function cardHTML(p) {
  return `
    <div class="product-card" data-cat="${p.categoria}" data-prezzo="${p.prezzo}">
      <img src="${p.immagine}" alt="${p.titolo}">
      <h2>${p.titoloBreve || p.titolo}</h2>
      <p>${p.descrizioneBreve || ""}</p>
      <p class="prezzo">€${p.prezzo}</p>
      <a href="prodotto.html?slug=${p.slug}" class="btn">Scopri di più</a>
    </div>
  `;
}

(async function initCatalogo() {
  const products = await loadProducts();
  const container = document.getElementById("catalogo");
  const categorieBox = document.getElementById("categorie");

  // Categorie dinamiche
  const categorie = [...new Set(products.map(p => p.categoria))].filter(Boolean);
  categorieBox.innerHTML = categorie
    .map(cat => `<button class="btn" data-cat="${cat}">${cat}</button>`)
    .join("");

  // Popola catalogo
  container.innerHTML = products.map(cardHTML).join("");

  // Filtri categoria
  categorieBox.addEventListener("click", e => {
    if (!e.target.dataset.cat) return;
    const cat = e.target.dataset.cat;
    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = card.dataset.cat === cat ? "block" : "none";
    });
  });

  // Filtri prezzo
  document.querySelectorAll("[data-prezzo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const max = parseFloat(btn.dataset.prezzo);
      document.querySelectorAll(".product-card").forEach(card => {
        const prezzo = parseFloat(card.dataset.prezzo);
        card.style.display = prezzo <= max ? "block" : "none";
      });
    });
  });

  // Reset
  document.getElementById("reset").addEventListener("click", () => {
    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = "block";
    });
  });
})();
