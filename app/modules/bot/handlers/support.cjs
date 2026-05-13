/**
 * modules/bot/handlers/support.cjs — VERSIONE 2027
 * Support Helper — funzioni di supporto per Professore AI
 * Nessun HTML, nessun GPT, solo JSON UI
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   LOGIN / REGISTRAZIONE / PASSWORD
============================================================ */
function supportLogin() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Per accedere al tuo account vai nella Dashboard → Accedi. Se hai dimenticato la password puoi reimpostarla dalla stessa pagina."
  };
}

function supportRegistrazione() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Per creare un nuovo account vai nella pagina di registrazione. Dopo la registrazione potrai accedere alla tua dashboard personale."
  };
}

function supportPasswordReset() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Per recuperare la password vai nella pagina di reset. Riceverai un’email con il link per impostarne una nuova."
  };
}

/* ============================================================
   ORDINI
============================================================ */
function supportOrdini() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Puoi vedere tutti i tuoi ordini nella Dashboard, nella sezione 'I miei ordini'."
  };
}

/* ============================================================
   DOWNLOAD
============================================================ */
function supportDownload() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Dopo l’acquisto ricevi subito il link di download nella tua Dashboard. Se non lo trovi, posso aiutarti a recuperarlo."
  };
}

/* ============================================================
   PAGAMENTI
============================================================ */
function supportPagamento() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "I pagamenti sono gestiti tramite PayPal. Se hai problemi con una transazione, posso aiutarti a capire cosa è successo."
  };
}

/* ============================================================
   RIMBORSO
============================================================ */
function supportRimborso() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Per richiedere un rimborso apri un ticket dalla pagina Assistenza. Il team risponde entro 24–48 ore."
  };
}

/* ============================================================
   CONTATTI
============================================================ */
function supportContatti() {
  return {
    type: "text",
    avatar: "professor_ai",
    text: "Puoi contattare il supporto via email all’indirizzo supporto@mewingmarket.it. Rispondiamo entro 24 ore."
  };
}

/* ============================================================
   FALLBACK GENERICO
============================================================ */
function supportGeneric() {
  return {
    type: "quick_replies",
    avatar: "professor_ai",
    text: "Posso aiutarti con assistenza, ordini, download, pagamenti o rimborsi. Cosa ti serve?",
    options: [
      { label: "Ordini", value: "ordini" },
      { label: "Download", value: "download" },
      { label: "Pagamenti", value: "pagamento" },
      { label: "Rimborso", value: "rimborso" },
      { label: "Contatti", value: "contatti" }
    ]
  };
}

/* ============================================================
   EXPORT — usato da Professore AI
============================================================ */
module.exports = {
  supportLogin,
  supportRegistrazione,
  supportPasswordReset,
  supportOrdini,
  supportDownload,
  supportPagamento,
  supportRimborso,
  supportContatti,
  supportGeneric
};
