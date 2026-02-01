// public/index.js

document.addEventListener("DOMContentLoaded", async () => {
  /* =========================================================
     HERO SLIDER (immagini animate ogni 4 secondi)
  ========================================================= */
  try {
    const resHero = await fetch("/products.json", { cache: "no-store" });
    const productsHero = await resHero.json();

    const images = productsHero
      .map(p => p.immagine)
      .filter(Boolean);

    const slider = document.getElementById("hero-slider");

    if (slider && images.length > 0) {
      let index = 0;

      function showImage() {
        slider.style.opacity = 0;

        setTimeout(() => {
          slider.src = images[index];
          slider.style.opacity = 1;
        }, 300);

        index = (index + 1) % images.length;
      }

      showImage();
      setInterval(showImage, 4000);
    }
  } catch (err) {
    console.error("Errore slider hero:", err);
  }

  /* =========================================================
     SEZIONE 3 PRODOTTI (come nella foto)
  ========================================================= */
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
