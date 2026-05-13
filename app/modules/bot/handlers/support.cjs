/**
 * modules/bot/handlers/support.cjs — VERSIONE VIDEOGIOCO 2027
 * Support Helper — Professore AI
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   LOGIN / REGISTRAZIONE / PASSWORD
============================================================ */
function supportLogin() {
  return {
    type: "text",
    avatar: "professor",
    text: "Per accedere vai nella Dashboard → Accedi. Se hai dimenticato la password puoi reimpostarla dalla stessa pagina."
  };
}

function supportRegistrazione() {
  return {
    type: "text",
    avatar: "professor",
    text: "Per creare un nuovo account vai nella pagina di registrazione. Dopo la registrazione potrai accedere alla tua dashboard personale."
  };
}

function supportPasswordReset() {
  return {
    type: "text",
    avatar: "professor",
    text: "Per recuperare la password vai nella pagina di reset. Riceverai un’email con il link per impostarne una nuova."
  };
}

/* ============================================================
   ORDINI
============================================================ */
function supportOrdini() {
  return {
    type: "text",
    avatar: "professor",
    text: "Puoi vedere tutti i tuoi ordini nella Dashboard, nella sezione 'I miei ordini'."
  };
}

/* ============================================================
   DOWNLOAD
============================================================ */
function supportDownload() {
  return {
    type: "text",
    avatar: "professor",
    text: "Dopo l’acquisto trovi il link di download nella tua Dashboard. Se non lo trovi, posso spiegarti come recuperarlo."
  };
}

/* ============================================================
   PAGAMENTI
============================================================ */
function supportPagamento() {
  return {
    type: "text",
    avatar: "professor",
    text: "I pagamenti sono gestiti tramite PayPal. Se hai problemi con una transazione, posso spiegarti come risolverli."
  };
}

/* ============================================================
   RIMBORSO
============================================================ */
function supportRimborso() {
  return {
    type: "text",
    avatar: "professor",
    text: "Per richiedere un rimborso apri un ticket dalla pagina Assistenza. Il team risponde entro 24–48 ore."
  };
}

/* ============================================================
   CONTATTI
============================================================ */
function supportContatti() {
  return {
    type: "text",
    avatar: "professor",
    text: "Puoi contattare il supporto via email all’indirizzo supporto@mewingmarket.it. Rispondiamo entro 24 ore."
  };
}

/* ============================================================
   TUTORIAL CARD (TV + video)
============================================================ */
function supportTutorial(videoUrl, title = "Tutorial") {
  return {
    type: "tutorial_card",
    avatar: "professor",
    title,
    steps: [
      "Segui le istruzioni sullo schermo",
      "Guarda il video tutorial",
      "Completa l’azione nella Dashboard"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: videoUrl
      }
    ]
  };
}

/* ============================================================
   FALLBACK GENERICO
============================================================ */
function supportGeneric() {
  return {
    type: "quick_replies",
    avatar: "professor",
    text: "Posso aiutarti con assistenza, ordini, download, pagamenti o rimborsi. Cosa ti serve?",
    options: [
      { label: "Ordini", intent: "ordini" },
      { label: "Download", intent: "download" },
      { label: "Pagamenti", intent: "pagamento" },
      { label: "Rimborso", intent: "rimborso" },
      { label: "Contatti", intent: "contatti" }
    ]
  };
}

/* ============================================================
   EXPORT — Professore AI
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
  supportTutorial,
  supportGeneric
};
