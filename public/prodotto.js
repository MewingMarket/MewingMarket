// prodotto.js
(async function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) return;

  const res = await fetch("/products.json", { cache: "no-store" });
  const products = await res.json();
  const p = products.find(pr => pr.slug === slug);
  if (!p) return;

  const container = document.getElementById("prodotto");
  container.innerHTML = `
    <div style="flex:1;">
      <img src="${p.immagine}" alt="${p.titolo}">
    </div>
    <div style="flex:1;">
      <h1>${p.titolo}</h1>
      <p>${p.descrizioneLunga || p.descrizioneBreve || ""}</p>
      <p class="prezzo">${p.prezzo}</p>
      <a href="${p.linkPayhip}" class="btn-acquista" target="_blank">Acquista ora</a>
    </div>
  `;

  document.getElementById("seo-title").innerText = `${p.titolo} – MewingMarket`;
  document.getElementById("seo-description").setAttribute("content", p.descrizioneBreve || "");

  document.getElementById("og-title").setAttribute("content", p.titolo);
  document.getElementById("og-description").setAttribute("content", p.descrizioneBreve || "");
  document.getElementById("og-image").setAttribute("content", p.immagine);
  document.getElementById("og-url").setAttribute("content", window.location.href);

  document.getElementById("tw-title").setAttribute("content", p.titolo);
  document.getElementById("tw-description").setAttribute("content", p.descrizioneBreve || "");
  document.getElementById("tw-image").setAttribute("content", p.immagine);
})();
