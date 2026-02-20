/**
 * premium/cards.cjs
 * Modulo completo per card prodotto, catalogo, video, prezzo e confronto.
 * Compatibile con la UI WhatsApp-style.
 */

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   CARD PRODOTTO
------------------------------------------ */
function productCard(product) {
  if (!product) return "";

  const titolo = escapeHTML(product.titolo || "");
  const breve = escapeHTML(product.titoloBreve || titolo);
  const prezzo = escapeHTML(product.prezzo || "");
  const link = escapeHTML(product.linkPayhip || "");
  const descrizione = escapeHTML(product.descrizioneBreve || "");

  return `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">${breve}</div>
    <div class="mm-card-price">${prezzo}€</div>
  </div>

  <div class="mm-card-body">
    <p>${descrizione}</p>
  </div>

  <div class="mm-card-footer">
    <a class="mm-btn" href="${link}" target="_blank">Acquista ora</a>
  </div>
</div>
`;
}

/* ------------------------------------------
   CARD CATALOGO
------------------------------------------ */
function catalogCard(products = []) {
  if (!Array.isArray(products) || !products.length) {
    return `<div class="mm-card">Nessun prodotto disponibile.</div>`;
  }

  let html = `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">📚 Catalogo MewingMarket</div>
  </div>
  <div class="mm-card-body">
`;

  for (const p of products) {
    const titolo = escapeHTML(p.titoloBreve || p.titolo || "");
    const prezzo = escapeHTML(p.prezzo || "");
    const link = escapeHTML(p.linkPayhip || "");

    html += `
    <div class="mm-product-row">
      <div class="mm-product-info">
        <div class="mm-product-title">${titolo}</div>
        <div class="mm-product-price">${prezzo}€</div>
      </div>
      <a class="mm-btn-small" href="${link}" target="_blank">Apri</a>
    </div>
    `;
  }

  html += `
  </div>
</div>
`;

  return html;
}

/* ------------------------------------------
   CARD VIDEO
------------------------------------------ */
function videoCard(url) {
  if (!url) {
    return `
<div class="mm-card">
  <div class="mm-card-body">
    Nessun video disponibile per questo prodotto.
  </div>
</div>
`;
  }

  const safeUrl = escapeHTML(url);

  return `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">🎥 Video di presentazione</div>
  </div>

  <div class="mm-card-body">
    <p>Guarda il video introduttivo del prodotto.</p>
  </div>

  <div class="mm-card-footer">
    <a class="mm-btn" href="${safeUrl}" target="_blank">Guarda il video</a>
  </div>
</div>
`;
}

/* ------------------------------------------
   CARD PREZZO
------------------------------------------ */
function priceCard(product) {
  if (!product) return "";

  const titolo = escapeHTML(product.titoloBreve || product.titolo || "");
  const prezzo = escapeHTML(product.prezzo || "");
  const link = escapeHTML(product.linkPayhip || "");

  return `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">💰 Prezzo: ${prezzo}€</div>
  </div>

  <div class="mm-card-body">
    <p><b>${titolo}</b> è un prodotto digitale immediatamente scaricabile dopo l’acquisto.</p>
  </div>

  <div class="mm-card-footer">
    <a class="mm-btn" href="${link}" target="_blank">Acquista ora</a>
  </div>
</div>
`;
}

/* ------------------------------------------
   CARD CONFRONTO
------------------------------------------ */
function compareCard(a, b) {
  if (!a || !b) {
    return `
<div class="mm-card">
  <div class="mm-card-body">
    Non ho abbastanza informazioni per confrontare i prodotti.
  </div>
</div>
`;
  }

  const titoloA = escapeHTML(a.titoloBreve || a.titolo || "");
  const titoloB = escapeHTML(b.titoloBreve || b.titolo || "");
  const prezzoA = escapeHTML(a.prezzo || "");
  const prezzoB = escapeHTML(b.prezzo || "");
  const linkA = escapeHTML(a.linkPayhip || "");
  const linkB = escapeHTML(b.linkPayhip || "");

  return `
<div class="mm-card">
  <div class="mm-card-header">
    <div class="mm-card-title">🔍 Confronto prodotti</div>
  </div>

  <div class="mm-card-body mm-compare">
    <div class="mm-compare-col">
      <div class="mm-compare-title">${titoloA}</div>
      <div class="mm-compare-price">${prezzoA}€</div>
      <a class="mm-btn-small" href="${linkA}" target="_blank">Apri</a>
    </div>

    <div class="mm-compare-col">
      <div class="mm-compare-title">${titoloB}</div>
      <div class="mm-compare-price">${prezzoB}€</div>
      <a class="mm-btn-small" href="${linkB}" target="_blank">Apri</a>
    </div>
  </div>
</div>
`;
}

/* ------------------------------------------
   EXPORT UNICO E CORRETTO
------------------------------------------ */
module.exports = {
  productCard,
  catalogCard,
  videoCard,
  priceCard,
  compareCard
};
