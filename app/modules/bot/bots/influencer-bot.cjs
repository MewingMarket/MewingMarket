/**
 * Influencer AI — Bot motivazionale / contenuti video (2027)
 * Path: app/modules/bot/bots/influencer-bot.cjs
 */

const path = require("path");
const db = require("../../db/database.cjs");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   MATCH — basato su INTENT, non sul testo
============================================================ */
function match(intent) {
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
   RUN — logica principale
============================================================ */
async function run(message, context = {}) {
  log("INFLUENCER_RUN", context);

  const intent = context.intent;
  const productId = context.productId || null;

  /* ============================================================
     1) VIDEO TUTORIAL PRODOTTO
  ============================================================ */
  if (intent === "video_prodotto" || intent === "tutorial_prodotto") {
    if (!productId) {
      return {
        avatar: "influencer_ai",
        type: "quick_replies",
        text: "Su quale prodotto vuoi un video tutorial?",
        options: [
          { label: "Prodotti consigliati", value: "catalogo" },
          { label: "Video motivazionale", value: "video_motivazionale" }
        ]
      };
    }

    const product = await db.get("SELECT * FROM prodotti WHERE id = ?", [productId]);

    return {
      avatar: "influencer_ai",
      type: "video",
      title: `Tutorial rapido: ${product.nome}`,
      url: `https://cdn.mewingmarket.it/video/tutorial-${product.id}.mp4`,
      actions: [
        { label: "Recensioni", value: `recensioni ${product.id}` },
        { label: "Correlati", value: `prodotti_correlati ${product.id}` }
      ]
    };
  }

  /* ============================================================
     2) VIDEO MOTIVAZIONALE
  ============================================================ */
  if (intent === "video_motivazionale") {
    return {
      avatar: "influencer_ai",
      type: "video",
      title: "🔥 Video motivazionale",
      url: "https://cdn.mewingmarket.it/video/motivazione-1.mp4",
      actions: [
        { label: "Altro video", value: "video_motivazionale" },
        { label: "Consiglio rapido", value: "consiglio_rapido" }
      ]
    };
  }

  /* ============================================================
     3) MOTIVAZIONE / HYPE
  ============================================================ */
  if (intent === "motivazione") {
    return {
      avatar: "influencer_ai",
      type: "text",
      text:
        "🔥 Simone, ogni volta che investi in te stesso stai costruendo una versione più forte di te. " +
        "Non serve essere perfetti: serve iniziare. E tu hai già iniziato.",
      actions: [
        { label: "Mostra un video", value: "video_motivazionale" },
        { label: "Consiglio rapido", value: "consiglio_rapido" }
      ]
    };
  }

  /* ============================================================
     4) CONSIGLIO RAPIDO
  ============================================================ */
  if (intent === "consiglio_rapido") {
    return {
      avatar: "influencer_ai",
      type: "quick_replies",
      text: "Ecco tre consigli rapidi:",
      options: [
        { label: "🔥 Migliora subito", value: "video_motivazionale" },
        { label: "📘 Impara una cosa nuova", value: "tutorial_prodotto" },
        { label: "💡 Consiglio del giorno", value: "consiglio_del_giorno" }
      ]
    };
  }

  /* ============================================================
     5) CONSIGLIO DEL GIORNO
  ============================================================ */
  if (intent === "consiglio_del_giorno") {
    return {
      avatar: "influencer_ai",
      type: "text",
      text:
        "💡 *Consiglio del giorno:* Non aspettare il momento perfetto. " +
        "Il momento perfetto è quando decidi di iniziare.",
      actions: [
        { label: "Mostra un video", value: "video_motivazionale" },
        { label: "Altro consiglio", value: "consiglio_rapido" }
      ]
    };
  }

  /* ============================================================
     6) FALLBACK INFLUENCER
  ============================================================ */
  return {
    avatar: "influencer_ai",
    type: "quick_replies",
    text: "Vuoi un video, un consiglio o un po' di motivazione?",
    options: [
      { label: "Mostra un video", value: "video_motivazionale" },
      { label: "Consiglio rapido", value: "consiglio_rapido" },
      { label: "Motivami", value: "motivazione" }
    ]
  };
}

module.exports = {
  name: "influencer",
  avatar: "influencer_ai",
  match,
  run
};
