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
/* ------------------------------------------
   COME INIZIARE — guida rapida post-acquisto
------------------------------------------ */
function gettingStartedMessage(product) {
  const titolo = escapeHTML(product?.titoloBreve || product?.titolo || "");

  return `
<div class="mm-rich">
  <div class="mm-rich-title">🚀 Come iniziare con ${titolo}</div>

  <div class="mm-rich-section">
    <div class="mm-rich-section-title">1. Scarica il materiale</div>
    <div class="mm-rich-section-body">
      Trovi tutto nel link Payhip che hai ricevuto via email.
    </div>
  </div>

  <div class="mm-rich-section">
    <div class="mm-rich-section-title">2. Apri la cartella principale</div>
    <div class="mm-rich-section-body">
      Dentro trovi la struttura completa del prodotto, già organizzata.
    </div>
  </div>

  <div class="mm-rich-section">
    <div class="mm-rich-section-title">3. Segui l’ordine consigliato</div>
    <div class="mm-rich-section-body">
      Parti dal file “LEGGIMI” o dalla guida introduttiva.
    </div>
  </div>
</div>
`;
}

/* ------------------------------------------
   RISORSE UTILI — link e materiali extra
------------------------------------------ */
function usefulResourcesMessage(product) {
  const titolo = escapeHTML(product?.titoloBreve || product?.titolo || "");

  return `
<div class="mm-info">
  <div class="mm-info-title">📚 Risorse utili per ${titolo}</div>
  <div class="mm-info-body">
    • Video introduttivo (se disponibile)<br>
    • Guida rapida PDF<br>
    • Template e file inclusi<br>
    • Accesso immediato al materiale
  </div>
</div>
`;
}

/* ------------------------------------------
   SERVE AIUTO? — supporto post-acquisto
------------------------------------------ */
function needHelpMessage() {
  return `
<div class="mm-warning">
  <div class="mm-warning-title">❓ Serve aiuto?</div>
  <div class="mm-warning-body">
    Posso aiutarti con:<br>
    • Download<br>
    • Accesso Payhip<br>
    • Problemi con i file<br>
    • Domande sul prodotto
  </div>
</div>
`;
}

module.exports = {
  postPurchaseMessage,
  gettingStartedMessage,
  usefulResourcesMessage,
  needHelpMessage
}; 
