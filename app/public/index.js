/* =========================================================
   HOME PREMIUM — UNIVERSAL JSON PATCH 2027.970
   Mapping SQL + Slider + Top 3 Prodotti
========================================================= */

console.log("[HOME] Inizializzazione homepage con Mapping SQL...");

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiHome(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   AVVIO HOMEPAGE
========================================================= */
document.addEventListener("critical-ready", () => {

  /* ------------------------------
     1) GRID HOMEPAGE (Top 3 Prodotti)
  ------------------------------ */
  (async () => {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    const data = await apiHome("/api/prodotti/getProdotti", { method: "GET" });
    if (!data) {
      grid.innerHTML = `<p class="info-msg">Il catalogo prodotti è in fase di aggiornamento.</p>`;
      return;
    }

    const products = Array.isArray(data) ? data : (data.prodotti || data.data || []);
    if (products.length === 0) {
      grid.innerHTML = `<p class="info-msg">Il catalogo prodotti è in fase di aggiornamento.</p>`;
      return;
    }

    grid.innerHTML = "";

    products.slice(0, 3).forEach((p) => {
      const img = p.immagine_url || p.immagine || "/placeholder.webp";
      const titolo = p.titolo || "Prodotto";
      const descrizione = p.descrizione_breve || "";
      const prezzo = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
      const id = p.id;

      const vId = p.youtube_video_id || p.video_id;
      const linkYouTube = vId
        ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-home">📺 Guarda video su YouTube</a>`
        : "";

      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div class="img-container">
          <img src="${img}" alt="${titolo}" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${titolo}</h3>
          <p class="desc-breve">${descrizione}</p>
          ${linkYouTube}
          <p class="price">€${prezzo}</p>

          <div class="card-buttons">
            <a href="prodotto.html?id=${id}" class="btn-dettagli" style="width: 100%; text-align: center;">Scopri di più</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  })();

  /* ------------------------------
     2) SLIDER HERO (Immagini dinamiche da SQL)
  ------------------------------ */
  (async () => {
    const dataHero = await apiHome("/api/prodotti/getProdotti", { method: "GET" });
    if (!dataHero) return;

    const productsHero = Array.isArray(dataHero) ? dataHero : (dataHero.prodotti || []);
    const images = productsHero
      .map(p => p.immagine_url || p.immagine)
      .filter(img => img && img.length > 5);

    const slider = document.getElementById("hero-slider");
    if (slider && images.length > 0) {
      let index = 0;
      const rotate = () => {
        slider.style.opacity = 0;
        setTimeout(() => {
          slider.src = images[index];
          slider.style.opacity = 1;
          index = (index + 1) % images.length;
        }, 400);
      };
      rotate();
      setInterval(rotate, 6000);
    }
  })();
});
