/**
 * Influencer AI — Bot motivazionale / contenuti video
 * Path: app/modules/bot/bots/influencer-bot.cjs
 */

const db = require("../../db/database.cjs"); // adatta se necessario

/* =========================================================
   MATCH — quando interviene l'Influencer AI
========================================================= */

function match(message) {
  if (!message) return false;
  const m = message.toLowerCase();

  return (
    m.includes("video") ||
    m.includes("tutorial") ||
    m.includes("motivami") ||
    m.includes("ispirami") ||
    m.includes("mostrami come") ||
    m.includes("come si fa") ||
    m.includes("hype") ||
    m.includes("consiglio veloce") ||
    m.includes("influencer") ||
    m.includes("motivazione")
  );
}

/* =========================================================
   RUN — logica principale dell'Influencer AI
========================================================= */

async function run(message, context = {}) {
  const m = message.toLowerCase();
  const productId = context.productId || context.lastProductId || null;

  /* --- VIDEO TUTORIAL SU PRODOTTO --- */
  if (m.includes("video") || m.includes("tutorial") || m.includes("mostrami come")) {
    if (!productId) {
      return {
        avatar: "influencer_ai",
        type: "quick_replies",
        text: "Su quale prodotto vuoi un video tutorial?",
        options: [
          { label: "Prodotti popolari", value: "prodotti consigliati" },
          { label: "Mostra video generico", value: "video motivazionale" }
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
        { label: "Mostra recensioni", value: `recensioni prodotto ${product.id}` },
        { label: "Prodotti correlati", value: `correlati ${product.id}` }
      ]
    };
  }

  /* --- MOTIVAZIONE / HYPE --- */
  if (m.includes("motivami") || m.includes("ispirami") || m.includes("hype")) {
    return {
      avatar: "influencer_ai",
      type: "text",
      text:
        "🔥 Ascolta, Simone. Ogni volta che investi in te stesso, stai costruendo una versione più forte di te. " +
        "Non serve essere perfetti: serve iniziare. E tu hai già iniziato.",
      actions: [
        { label: "Mostra un video", value: "video motivazionale" },
        { label: "Consigli rapidi", value: "consiglio veloce" }
      ]
    };
  }

  /* --- CONSIGLI RAPIDI --- */
  if (m.includes("consiglio veloce")) {
    return {
      avatar: "influencer_ai",
      type: "quick_replies",
      text: "Ecco tre consigli rapidi:",
      options: [
        { label: "🔥 Migliora subito", value: "video motivazionale" },
        { label: "📘 Impara una cosa nuova", value: "tutorial veloce" },
        { label: "💡 Consiglio del giorno", value: "consiglio del giorno" }
      ]
    };
  }

  /* --- CONSIGLIO DEL GIORNO --- */
  if (m.includes("consiglio del giorno")) {
    return {
      avatar: "influencer_ai",
      type: "text",
      text:
        "💡 *Consiglio del giorno:* Non aspettare il momento perfetto. " +
        "Il momento perfetto è quando decidi di iniziare.",
      actions: [
        { label: "Mostra un video", value: "video motivazionale" },
        { label: "Altro consiglio", value: "consiglio veloce" }
      ]
    };
  }

  /* --- VIDEO MOTIVAZIONALE GENERICO --- */
  if (m.includes("video motivazionale")) {
    return {
      avatar: "influencer_ai",
      type: "video",
      title: "🔥 Video motivazionale",
      url: "https://cdn.mewingmarket.it/video/motivazione-1.mp4",
      actions: [
        { label: "Altro video", value: "video motivazionale" },
        { label: "Consiglio rapido", value: "consiglio veloce" }
      ]
    };
  }

  /* --- FALLBACK --- */
  return {
    avatar: "influencer_ai",
    type: "quick_replies",
    text: "Vuoi un video, un consiglio o un po' di motivazione?",
    options: [
      { label: "Mostra un video", value: "video motivazionale" },
      { label: "Consiglio veloce", value: "consiglio veloce" },
      { label: "Motivami", value: "motivami" }
    ]
  };
}

module.exports = {
  name: "Influencer AI",
  avatar: "influencer_ai",
  match,
  run
};
