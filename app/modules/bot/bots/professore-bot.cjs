/**
 * Professore AI — NPC tecnico / guida / spiegazioni (2027)
 * Path: app/modules/bot/bots/professore-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const support = require(path.join(process.cwd(), "app/modules/bot/handlers/support.cjs"));
const legal = require(path.join(process.cwd(), "app/modules/bot/handlers/legal.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "supporto",
    "ordini",
    "download",
    "pagamento",
    "rimborso",
    "contatti",
    "login",
    "registrazione",
    "password_reset",
    "privacy",
    "termini",
    "cookie",
    "spiega",
    "come_funziona"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale del Professore AI
============================================================ */
async function run(message, context = {}) {
  log("PROFESSORE_RUN", {
    uid: context.uid,
    intent: context.intent?.intent
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";

  /* ============================================================
     1) ORDINI (spiegazione, non DB)
  ============================================================= */
  if (intent === "ordini") {
    return {
      avatar: "professor",
      type: "guide",
      title: "Come vedere i tuoi ordini",
      steps: [
        "Accedi alla Dashboard",
        "Vai nella sezione *I miei ordini*",
        "Troverai la lista completa dei tuoi acquisti"
      ],
      actions: [
        { label: "Mostra download", intent: "download" },
        { label: "Torna al menu", intent: "menu" }
      ]
    };
  }

  /* ============================================================
     2) DOWNLOAD (spiegazione, non DB)
  ============================================================= */
  if (intent === "download") {
    return {
      avatar: "professor",
      type: "guide",
      title: "Come accedere ai tuoi download",
      steps: [
        "Accedi alla Dashboard",
        "Vai nella sezione *I miei download*",
        "Troverai tutti i file acquistati"
      ],
      actions: [
        { label: "Come funziona", intent: "come_funziona" }
      ]
    };
  }

  /* ============================================================
     3) SUPPORTO STANDARD (usa Support Helper)
  ============================================================= */
  if (intent === "login")          return support.supportLogin();
  if (intent === "registrazione")  return support.supportRegistrazione();
  if (intent === "password_reset") return support.supportPasswordReset();
  if (intent === "pagamento")      return support.supportPagamento();
  if (intent === "rimborso")       return support.supportRimborso();
  if (intent === "contatti")       return support.supportContatti();
  if (intent === "supporto")       return support.supportGeneric();

  /* ============================================================
     4) POLICY / LEGAL (usa Legal Helper)
  ============================================================= */
  if (intent === "privacy") return legal.legalPrivacy();
  if (intent === "termini") return legal.legalTerms();
  if (intent === "cookie")  return legal.legalCookie();

  /* ============================================================
     5) SPIEGAZIONI TECNICHE
  ============================================================= */
  if (intent === "come_funziona") {
    const video = "https://cdn.mewingmarket.it/video/come-funziona.mp4";

    return {
      avatar: "professor",
      type: "tutorial_card",
      title: "Come funziona il sistema",
      steps: [
        "Acquisti un prodotto digitale",
        "Lo trovi subito nella Dashboard",
        "Puoi scaricarlo o consultarlo quando vuoi"
      ],
      actions: [
        {
          label: "Guarda il video",
          type: "open_video",
          video_url: video
        }
      ]
    };
  }

  if (intent === "spiega") {
    return {
      avatar: "professor",
      type: "text",
      text: "Certo! Dimmi cosa vuoi che ti spieghi e preparo una risposta chiara e semplice."
    };
  }

  /* ============================================================
     6) FALLBACK
  ============================================================= */
  return {
    avatar: "professor",
    type: "quick_replies",
    text: "Come posso aiutarti?",
    options: [
      { label: "Ordini", intent: "ordini" },
      { label: "Download", intent: "download" },
      { label: "Spiegami qualcosa", intent: "spiega" }
    ]
  };
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "professor",
  avatar: "professor",
  match,
  run
};
