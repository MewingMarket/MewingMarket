/**
 * premium/postPurchase.cjs
 * Modulo per messaggi premium dopo l’acquisto.
 */

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   MESSAGGIO POST-ACQUISTO — principale
------------------------------------------ */
function postPurchaseMessage(product) {
  if (!product) return "";

  const titolo = escapeHTML(product.titoloBreve || product.titolo || "");
  const link = escapeHTML(product.linkPayhip || "");

  return `
<div class="mm-success">
  <div class="mm-success-title">🎉 Acquisto completato!</div>
  <div class="mm-success-body">
    Hai appena acquistato <b>${titolo}</b>.<br>
    Il link per scaricare il prodotto è già disponibile nella tua email Payhip.
  </div>
</div>

<div class="mm-info">
  <div class="mm-info-title">📥 Download immediato</div>
  <div class="mm-info-body">
    Puoi anche scaricarlo direttamente da qui:<br>
    <a href="${link}" target="_blank">Apri il tuo prodotto</a>
  </div>
</div>
`;
}

module.exports = {
  postPurchaseMessage
};
