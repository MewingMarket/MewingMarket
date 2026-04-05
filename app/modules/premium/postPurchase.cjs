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
  const id = escapeHTML(String(product.id || ""));
  const link = `https://www.mewingmarket.it/prodotto/${id}`;

  return `
<div class="mm-success">
  <div class="mm-success-title">🎉 Acquisto completato!</div>
  <div class="mm-success-body">
    Hai appena acquistato <b>${titolo}</b>.<br>
    Puoi accedere subito al tuo prodotto dalla pagina dedicata.
  </div>
</div>

<div class="mm-info">
  <div class="mm-info-title">📥 Accesso immediato</div>
  <div class="mm-info-body">
    Apri la pagina del prodotto per trovare tutti i materiali:<br>
    <a href="${link}" target="_blank">Apri il tuo prodotto</a>
  </div>
</div>
`;
}

/* ------------------------------------------
   COME INIZIARE — guida rapida post-acquisto
------------------------------------------ */
function gettingStartedMessage(product) {
  const titolo = escapeHTML(product?.titoloBreve || product?.titolo || "");

  return `
<div class="mm-rich">
  <div class="mm-rich-title">🚀 Come iniziare con ${titolo}</div>

  <div class="mm-rich-section">
    <div class="mm-rich-section-title">1. Accedi al materiale</div>
    <div class="mm-rich-section-body">
      Tutti i file sono disponibili nella pagina del prodotto.
    </div>
  </div>

  <div class="mm-rich-section">
    <div class="mm-rich-section-title">2. Apri la cartella principale</div>
    <div class="mm-rich-section-body">
      Troverai la struttura completa del prodotto, già organizzata.
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
    • Accesso ai file<br>
    • Problemi con gli archivi<br>
    • Domande sul prodotto
  </div>
</div>
`;
}

/* ------------------------------------------
   EXPORT UNICO
------------------------------------------ */
module.exports = {
  postPurchaseMessage,
  gettingStartedMessage,
  usefulResourcesMessage,
  needHelpMessage
};
