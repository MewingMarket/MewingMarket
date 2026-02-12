// public/index.js — versione blindata

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     SANITIZZAZIONE
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (url) =>
    typeof url === "string" && url.startsWith("http")
      ? url
      : "";

  /* =========================================================
     HERO SLIDER (blindato)
  ========================================================== */
  try {
    const resHero = await fetch("/products.json", { cache: "no-store" });
    if (!resHero.ok) throw new Error("products.json non disponibile");

    const productsHero = await resHero.json();
    if (!Array.isArray(productsHero)) throw new Error("Formato JSON non valido");

    const images = productsHero
      .map(p => safeURL(p.immagine))
      .filter(Boolean);

    const slider = document.getElementById("hero-slider");

    if (slider && images.length > 0) {
      let index = 0;
      let locked = false;

      function showImage() {
        if (locked) return;
        locked = true;

        slider.style.opacity = 0;

        setTimeout(() => {
          slider.src = images[index];
          slider.style.opacity = 1;
          locked = false;
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
     SEZIONE 3 PRODOTTI (blindata)
  ========================================================== */
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  try {
    const res = await fetch("/products.json", { cache: "no-store" });
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

    products.slice(0, 3).forEach((p) => {
      const img = safeURL(p.immagine) || "/placeholder.webp";
      const titolo = clean(p.titoloBreve || p.titolo);
      const descrizione = clean(p.descrizioneBreve || "");
      const prezzo = p.prezzo ? clean(String(p.prezzo)) + " €" : "";
      const slug = clean(p.slug);

      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <img src="${img}" 
             alt="${titolo}" 
             loading="lazy">

        <h3>${titolo}</h3>
        <p>${descrizione}</p>
        <p class="price">${prezzo}</p>

        <a href="/prodotto.html?slug=${encodeURIComponent(slug)}" class="btn">
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
