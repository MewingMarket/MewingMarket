/**
 * premium/crossSell.cjs
 * Modulo per suggerimenti intelligenti (cross-sell).
 */

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   CROSS-SELL GENERICO — suggerimento base
------------------------------------------ */
function crossSellGeneric(product) {
  if (!product) return "";

  return `
<div class="mm-info">
  <div class="mm-info-title">💡 Ti potrebbe interessare anche</div>
  <div class="mm-info-body">
    Posso consigliarti prodotti correlati per migliorare ancora di più i tuoi risultati.
  </div>
</div>
`;
}

/* ------------------------------------------
   CROSS-SELL PER CATEGORIA
------------------------------------------ */
function crossSellByCategory(product, allProducts = []) {
  if (!product || !Array.isArray(allProducts)) return "";

  const categoria = product.categoria || product.category;
  if (!categoria) return crossSellGeneric(product);

  const correlati = allProducts.filter(
    p => p.id !== product.id && p.categoria === categoria
  );

  if (!correlati.length) return crossSellGeneric(product);

  let html = `
<div class="mm-info">
  <div class="mm-info-title">🔗 Prodotti correlati</div>
  <div class="mm-info-body">
    Altri prodotti nella categoria <b>${escapeHTML(categoria)}</b>:
  </div>
</div>
`;

  for (const p of correlati) {
    const id = escapeHTML(String(p.id || ""));
    const link = `https://www.mewingmarket.it/prodotto/${id}`;

    html += `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">${escapeHTML(p.titoloBreve || p.titolo)}</div>
    <div class="mm-card-price">${escapeHTML(p.prezzo)}€</div>
  </div>
  <div class="mm-card-footer">
    <a class="mm-btn-small" href="${link}" target="_blank">Apri</a>
  </div>
</div>
`;
  }

  return html;
}

/* ------------------------------------------
   CROSS-SELL SPECIFICO PER PRODOTTO
------------------------------------------ */
function crossSellByProduct(product, allProducts = []) {
  if (!product) return "";

  const titolo = product.titoloBreve || product.titolo || "";
  const keywords = titolo.toLowerCase().split(" ");

  const correlati = allProducts.filter(p => {
    if (p.id === product.id) return false;
    const t = (p.titoloBreve || p.titolo || "").toLowerCase();
    return keywords.some(k => t.includes(k));
  });

  if (!correlati.length) return crossSellGeneric(product);

  let html = `
<div class="mm-info">
  <div class="mm-info-title">✨ Basato su ciò che hai visto</div>
  <div class="mm-info-body">
    Questi prodotti sono particolarmente affini a <b>${escapeHTML(titolo)}</b>:
  </div>
</div>
`;

  for (const p of correlati) {
    const id = escapeHTML(String(p.id || ""));
    const link = `https://www.mewingmarket.it/prodotto/${id}`;

    html += `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">${escapeHTML(p.titoloBreve || p.titolo)}</div>
    <div class="mm-card-price">${escapeHTML(p.prezzo)}€</div>
  </div>
  <div class="mm-card-footer">
    <a class="mm-btn-small" href="${link}" target="_blank">Apri</a>
  </div>
</div>
`;
  }

  return html;
}

/* ------------------------------------------
   CROSS-SELL UPGRADE — versione premium
------------------------------------------ */
function crossSellUpgrade(product, allProducts = []) {
  if (!product) return "";

  const titolo = product.titoloBreve || product.titolo || "";

  const upgrade = allProducts.filter(
    p =>
      p.id !== product.id &&
      p.categoria === product.categoria &&
      Number(p.prezzo) > Number(product.prezzo)
  );

  if (!upgrade.length) return "";

  const best = upgrade.sort((a, b) => Number(b.prezzo) - Number(a.prezzo))[0];

  const id = escapeHTML(String(best.id || ""));
  const link = `https://www.mewingmarket.it/prodotto/${id}`;

  return `
<div class="mm-success">
  <div class="mm-success-title">⬆️ Upgrade consigliato</div>
  <div class="mm-success-body">
    Se vuoi una versione più completa rispetto a <b>${escapeHTML(titolo)}</b>, valuta:
  </div>
</div>

<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">${escapeHTML(best.titoloBreve || best.titolo)}</div>
    <div class="mm-card-price">${escapeHTML(best.prezzo)}€</div>
  </div>
  <div class="mm-card-footer">
    <a class="mm-btn" href="${link}" target="_blank">Scopri di più</a>
  </div>
</div>
`;
}

/* EXPORT UNICO */
module.exports = {
  crossSellGeneric,
  crossSellByCategory,
  crossSellByProduct,
  crossSellUpgrade
};
