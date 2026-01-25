// prodotto.js — blindato + video YouTube

function renderYouTubeEmbed(p) {
  if (!p.youtube_url) return "";
  const embedUrl = p.youtube_url.replace("watch?v=", "embed/");
  return `
    <div class="video-embed">
      <iframe width="560" height="315"
        src="${embedUrl}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  `;
}

(async function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) return;

  const res = await fetch("products.json", { cache: "no-store" });
  const products = await res.json();
  const p = products.find(pr => pr.slug === slug);
  if (!p) return;

  // Popola contenuto prodotto
  const container = document.getElementById("prodotto");
  container.innerHTML = `
    <div class="hero-wrapper">
      <div class="hero-media">
        <img src="${p.immagine}" alt="${p.titolo}">
        ${renderYouTubeEmbed(p)}
      </div>
      <div class="hero-content">
        <h1>${p.titolo}</h1>
        <p>${p.descrizioneLunga || p.descrizioneBreve || ""}</p>
        <p class="prezzo">€${p.prezzo}</p>
        <a href="${p.linkPayhip}" class="btn-acquista" target="_blank">Acquista ora</a>
      </div>
    </div>
  `;

  // Prodotti correlati
  const relatedBox = document.getElementById("related");
  products
    .filter(pr => pr.categoria === p.categoria && pr.slug !== slug)
    .slice(0, 4)
    .forEach(pr => {
      relatedBox.innerHTML += `
        <div class="product-card">
          <img src="${pr.immagine}" alt="${pr.titolo}">
          <h2>${pr.titoloBreve || pr.titolo}</h2>
          <p>${pr.descrizioneBreve || ""}</p>
          <p class="prezzo">€${pr.prezzo}</p>
          <a href="prodotto.html?slug=${pr.slug}" class="btn">Scopri di più</a>
        </div>
      `;
    });
})();
