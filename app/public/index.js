// public/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  try {
    const res = await fetch("/products.json");
    if (!res.ok) {
      grid.innerHTML = `<p>Il catalogo sarà presto disponibile.</p>`;
      return;
    }

    const products = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML = `<p>Il catalogo sarà presto disponibile.</p>`;
      return;
    }

    grid.innerHTML = "";

    // MOSTRA SOLO 3 PRODOTTI COME NELLA FOTO
    products.slice(0, 3).forEach((p) => {
      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <img src="${p.immagine}" 
             alt="${p.titolo}" 
             loading="lazy">

        <h3>${p.titoloBreve || p.titolo}</h3>
        <p>${p.descrizioneBreve || ""}</p>
        <p class="price">${p.prezzo ? p.prezzo + " €" : ""}</p>

        <a href="/prodotto.html?slug=${encodeURIComponent(p.slug)}" class="btn">
          Scopri
        </a>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    grid.innerHTML = `<p>Al momento il catalogo non è disponibile.</p>`;
  }
});
