// =========================================================
// File: app/public/index.js
// Versione definitiva: Airtable + API interne + slider + fallback
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const safeURL = (url) =>
    typeof url === "string" && url.startsWith("http")
      ? url
      : "";

  /* =========================================================
     FALLBACK DESCRIZIONE BREVE
  ========================================================= */
  function getShortDescription(p) {
    if (p.descrizione_breve && p.descrizione_breve.trim() !== "") {
      return clean(p.descrizione_breve);
    }

    const full = p.descrizione || "";
    const short = full.length > 120 ? full.slice(0, 120) + "…" : full;

    return clean(short);
  }

  /* =========================================================
     FALLBACK IMMAGINE
  ========================================================= */
  function getImage(p) {
    if (p.immagine && p.immagine.startsWith("http")) {
      return p.immagine;
    }
    return "/placeholder.webp";
  }

  /* =========================================================
     1) SLIDER HERO (immagini random dai prodotti)
  ========================================================= */
  try {
    const resHero = await fetch("/api/products", { cache: "no-store" });
    const dataHero = await resHero.json();

    if (!dataHero.success) throw new Error("API non disponibile");

    const productsHero = dataHero.products;
    const images = productsHero.map(getImage).filter(Boolean);

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
     2) GRID HOMEPAGE (primi 3 prodotti)
  ========================================================= */
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products) || data.products.length === 0) {
      grid.innerHTML = `<p>Il catalogo sarà presto disponibile.</p>`;
      return;
    }

    const products = data.products;

    grid.innerHTML = "";

    products.slice(0, 3).forEach((p) => {
      const img = getImage(p);
      const titolo = clean(p.titolo || "Prodotto");
      const descrizione = getShortDescription(p);
      const prezzo = p.prezzo ? clean(String(p.prezzo)) + " €" : "";
      const slug = clean(p.slug || "");

      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <img src="${img}" alt="${titolo}" loading="lazy">
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
