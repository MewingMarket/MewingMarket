/**
 * modules/bot/handlers/support.cjs — VERSIONE VIDEOGIOCO 2027 (PATCH COMPLETA)
 * Support Helper — Professore AI
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   LOGIN / REGISTRAZIONE / PASSWORD
============================================================ */
function supportLogin() {
  log("SUPPORT_LOGIN");

  return {
    type: "text",
    avatar: "professor",
    text: "Per accedere vai nella Dashboard → Accedi. Se hai dimenticato la password puoi reimpostarla dalla stessa pagina."
  };
}

function supportRegistrazione() {
  log("SUPPORT_REGISTRAZIONE");

  return {
    type: "text",
    avatar: "professor",
    text: "Per creare un nuovo account vai nella pagina di registrazione. Dopo la registrazione potrai accedere alla tua dashboard personale."
  };
}

function supportPasswordReset() {
  log("SUPPORT_PASSWORD_RESET");

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
  log("SUPPORT_ORDINI");

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
  log("SUPPORT_DOWNLOAD");

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
  log("SUPPORT_PAGAMENTO");

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
  log("SUPPORT_RIMBORSO");

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
  log("SUPPORT_CONTATTI");

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
  log("SUPPORT_TUTORIAL", { videoUrl, title });

  const safeUrl = typeof videoUrl === "string" ? videoUrl : null;

  return {
    type: "tutorial_card",
    avatar: "professor",
    title,
    steps: [
      "Segui le istruzioni sullo schermo",
      "Guarda il video tutorial",
      "Completa l’azione nella Dashboard"
    ],
    actions: safeUrl
      ? [
          {
            label: "Guarda il video",
            type: "open_video",
            video_url: safeUrl
          }
        ]
      : []
  };
}

/* ============================================================
   FALLBACK GENERICO
============================================================ */
function supportGeneric() {
  log("SUPPORT_GENERIC");

  return {
    type: "quick_replies",
    avatar: "professor",
    text: "Posso aiutarti con assistenza, ordini, download, pagamenti o rimborsi. Cosa ti serve?",
    options: [
      { label: "Ordini", intent: "ordini" },
      { label: "Download", intent: "download" },
      { label: "Pagamenti", intent: "pagamento" },
      { label: "Rimborso", intent: "rimborso" },
      { label: "Contatti", intent: "contatti" },
      { label: "Menu", intent: "menu" }
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
