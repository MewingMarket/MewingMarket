/**
 * premium/cards.cjs
 * Modulo per card prodotto, card catalogo, card video, card prezzo.
 * Compatibile con la UI WhatsApp-style del tuo front-end.
 */

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   CARD PRODOTTO — versione elegante
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

module.exports = {
  productCard
};
