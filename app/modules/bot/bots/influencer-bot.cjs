/**
 * Influencer AI — NPC motivazionale / PR / video (2027)
 * Path: app/modules/bot/bots/influencer-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const social = require(path.join(process.cwd(), "app/modules/bot/handlers/social.cjs"));
const catalogHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/catalogHandler.cjs"));
const productHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/productHandler.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "video_prodotto",
    "video_motivazionale",
    "tutorial_prodotto",
    "motivazione",
    "consiglio_rapido",
    "consiglio_del_giorno",
    "influencer"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}) {
  log("INFLUENCER_RUN", context);

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const productId = intentObj.productId || null;
  const catalog = context.catalog || [];

  /* ============================================================
     1) VIDEO TUTORIAL PRODOTTO
  ============================================================= */
  if (intent === "video_prodotto" || intent === "tutorial_prodotto") {
    if (!productId) {
      return {
        avatar: "influencer",
        type: "quick_replies",
        text: "Su quale prodotto vuoi un video tutorial?",
        options: [
          { label: "Prodotti consigliati", intent: "catalogo" },
          { label: "Video motivazionale", intent: "video_motivazionale" }
        ]
      };
    }

    const p = catalog.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "influencer",
        type: "text",
        text: "Non trovo il prodotto per il tutorial."
      };
    }

    return {
      type: "tutorial_card",
      avatar: "influencer",
      title: `Tutorial rapido: ${p.titolo_breve}`,
      steps: [
        "Guarda il video sulla TV",
        "Segui i passaggi",
        "Applica subito ciò che impari"
      ],
      actions: [
        {
          label: "Guarda il video",
          type: "open_video",
          video_url: p.youtube_url
        }
      ]
    };
  }

  /* ============================================================
     2) VIDEO MOTIVAZIONALE
  ============================================================= */
  if (intent === "video_motivazionale") {
    return {
      type: "tutorial_card",
      avatar: "influencer",
      title: "🔥 Video motivazionale",
      steps: [
        "Guarda il video sulla TV",
        "Respira",
        "Riparti più forte"
      ],
      actions: [
        {
          label: "Guarda il video",
          type: "open_video",
          video_url: "https://cdn.mewingmarket.it/video/motivazione-1.mp4"
        }
      ]
    };
  }

  /* ============================================================
     3) MOTIVAZIONE / HYPE
  ============================================================= */
  if (intent === "motivazione") {
    return {
      avatar: "influencer",
      type: "text",
      text:
        "🔥 Simone, ogni passo che fai costruisce una versione più forte di te. " +
        "Non serve essere perfetti: serve iniziare. E tu hai già iniziato.",
      actions: [
        { label: "Mostra un video", intent: "video_motivazionale" },
        { label: "Consiglio rapido", intent: "consiglio_rapido" }
      ]
    };
  }

  /* ============================================================
     4) CONSIGLIO RAPIDO
  ============================================================= */
  if (intent === "consiglio_rapido") {
    return {
      avatar: "influencer",
      type: "quick_replies",
      text: "Ecco tre consigli rapidi:",
      options: [
        { label: "🔥 Migliora subito", intent: "video_motivazionale" },
        { label: "📘 Impara una cosa nuova", intent: "tutorial_prodotto" },
        { label: "💡 Consiglio del giorno", intent: "consiglio_del_giorno" }
      ]
    };
  }

  /* ============================================================
     5) CONSIGLIO DEL GIORNO
  ============================================================= */
  if (intent === "consiglio_del_giorno") {
    return {
      avatar: "influencer",
      type: "text",
      text:
        "💡 *Consiglio del giorno:* Non aspettare il momento perfetto. " +
        "Il momento perfetto è quando decidi di iniziare.",
      actions: [
        { label: "Mostra un video", intent: "video_motivazionale" },
        { label: "Altro consiglio", intent: "consiglio_rapido" }
      ]
    };
  }

  /* ============================================================
     6) FALLBACK INFLUENCER
  ============================================================= */
  return {
    avatar: "influencer",
    type: "quick_replies",
    text: "Vuoi un video, un consiglio o un po' di motivazione?",
    options: [
      { label: "Mostra un video", intent: "video_motivazionale" },
      { label: "Consiglio rapido", intent: "consiglio_rapido" },
      { label: "Motivami", intent: "motivazione" }
    ]
  };
}

/* ============================================================
   SIDEKICK — compresenza (quando parla il Vendor)
============================================================ */
async function sidekick(message, context = {}) {
  return {
    avatar: "influencer",
    type: "text",
    text: "🔥 Questo prodotto spacca! Se vuoi ti mostro anche un video motivazionale.",
    actions: [
      { label: "Mostra video", intent: "video_motivazionale" }
    ]
  };
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "influencer",
  avatar: "influencer",
  match,
  run,
  sidekick
};
