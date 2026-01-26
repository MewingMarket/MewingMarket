// prodotto.js — versione blindata + YouTube fix totale

function extractYouTubeID(url) {
  if (!url) return null;

  // Caso: https://youtu.be/ID
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }

  // Caso: https://www.youtube.com/watch?v=ID
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1].split("&")[0];
  }

  // Caso: embed già pronto
  if (url.includes("embed/")) {
    return url.split("embed/")[1].split("?")[0];
  }

  return null;
}

function renderYouTubeEmbed(p) {
  const id = extractYouTubeID(p.youtube_url);
  if (!id) return "";

  return `
    <div class="video-embed">
      <iframe
        src="https://www.youtube.com/embed/${id}"
        title="YouTube video"
        loading="lazy"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
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
