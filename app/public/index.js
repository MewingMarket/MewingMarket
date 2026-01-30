// public/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  try {
    const res = await fetch("/products.json");
    if (!res.ok) {
      console.warn("Nessun products.json ancora disponibile");
      return;
    }

    const products = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML = `<p>Il catalogo sarà presto disponibile. Stiamo preparando i primi prodotti.</p>`;
      return;
    }

    grid.innerHTML = "";

    products.forEach((p) => {
      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <img src="${p.immagine}" alt="${p.titolo}" loading="lazy">
        <h3>${p.titoloBreve || p.titolo}</h3>
        <p>${p.descrizioneBreve || ""}</p>
        <p class="price">${p.prezzo ? p.prezzo + " €" : ""}</p>
        <div class="actions">
          <a href="/prodotto.html?slug=${encodeURIComponent(p.slug)}"
             class="btn"
             data-track="product_open"
             data-track-extra='${JSON.stringify({ slug: p.slug })}'>
            Dettagli
          </a>
          <a href="${p.linkPayhip}"
             class="btn-secondary"
             target="_blank" rel="noopener"
             data-track="product_buy_click"
             data-track-extra='${JSON.stringify({ slug: p.slug })}'>
            Acquista su Payhip
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    grid.innerHTML = `<p>Al momento il catalogo non è disponibile. Riprova più tardi.</p>`;
  }
});
