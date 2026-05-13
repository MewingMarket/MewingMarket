/**
 * Router AI — Smistamento bot intelligente
 * Path: app/modules/bot/core/router-bot.cjs
 */

const path = require("path");

// Carichiamo i bot specializzati
const vendorBot = require(path.join(process.cwd(), "app/modules/bot/bots/vendor.bot.cjs"));
const professorBot = require(path.join(process.cwd(), "app/modules/bot/bots/professore.bot.cjs"));
const influencerBot = require(path.join(process.cwd(), "app/modules/bot/bots/influencer.bot.cjs"));
const newsletterBot = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter.bot.cjs"));
const genericBot = require(path.join(process.cwd(), "app/modules/bot/bots/generic.bot.cjs"));

// Motore AI universale (intent detection)
const ai = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   BOT REGISTRY — ordine di priorità
============================================================ */
const BOT_LIST = [
  vendorBot,
  professorBot,
  influencerBot,
  newsletterBot,
  genericBot // fallback finale
];

/* ============================================================
   ROUTER PRINCIPALE
============================================================ */
async function routeMessage(message, context = {}) {
  const cleanMsg = (message || "").trim();
  if (!cleanMsg) {
    return {
      avatar: "assistant",
      type: "text",
      text: "Non ho ricevuto alcun messaggio."
    };
  }

  /* ============================================================
     1) INTENT DETECTION (AI)
  ============================================================= */
  let intent = { intent: "generico" };

  try {
    intent = await ai.generateIntent(cleanMsg, context);
  } catch (err) {
    intent = { intent: "generico" };
  }

  context.intent = intent;

  /* ============================================================
     2) MATCH BOT MANUALE (keyword-based)
     — garantisce compatibilità anche senza AI
  ============================================================= */
  for (const bot of BOT_LIST) {
    try {
      if (bot.match(cleanMsg)) {
        return await bot.run(cleanMsg, context);
      }
    } catch (err) {
      console.error("❌ Errore bot:", bot.name, err);
    }
  }

  /* ============================================================
     3) MATCH BOT BASATO SU INTENT
  ============================================================= */
  switch (intent.intent) {
    case "recensioni":
    case "prezzo":
    case "prodotti_correlati":
      return await vendorBot.run(cleanMsg, context);

    case "assistenza":
    case "download":
    case "ordini":
    case "rimborso":
      return await professorBot.run(cleanMsg, context);

    case "video_motivazionale":
    case "tutorial":
    case "hype":
      return await influencerBot.run(cleanMsg, context);

    case "newsletter":
    case "follow_up":
    case "novità":
      return await newsletterBot.run(cleanMsg, context);

    default:
      return await genericBot.run(cleanMsg, context);
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  routeMessage
};
