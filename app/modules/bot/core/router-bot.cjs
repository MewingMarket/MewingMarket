/**
 * Router AI — VERSIONE VIDEOGIOCO 2027
 * Smistamento avatar intelligente + compresenza + handoff
 * Path: app/modules/bot/core/router.bot.cjs
 */

const path = require("path");

// Intent Engine locale (NO GPT)
const { generateIntent } = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));

// Avatar (NPC)
const vendorBot = require(path.join(process.cwd(), "app/modules/bot/bots/vendor.bot.cjs"));
const professorBot = require(path.join(process.cwd(), "app/modules/bot/bots/professore.bot.cjs"));
const influencerBot = require(path.join(process.cwd(), "app/modules/bot/bots/influencer.bot.cjs"));
const newsletterBot = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter.bot.cjs"));
const genericBot = require(path.join(process.cwd(), "app/modules/bot/bots/generic.bot.cjs"));

/* ============================================================
   BOT REGISTRY — ordine di priorità
============================================================ */
const BOT_MAP = {
  vendor: vendorBot,
  professor: professorBot,
  influencer: influencerBot,
  newsletter: newsletterBot,
  assistant: genericBot
};

/* ============================================================
   ROUTER PRINCIPALE — versione videogioco
============================================================ */
async function routeMessage(message, context = {}) {
  const cleanMsg = (message || "").trim();
  if (!cleanMsg) {
    return [
      {
        avatar: "assistant",
        type: "text",
        text: "Non ho ricevuto alcun messaggio."
      }
    ];
  }

  /* ============================================================
     1) INTENT ENGINE (locale, deterministico)
  ============================================================= */
  const intentData = await generateIntent(cleanMsg, context.catalog || []);
  context.intent = intentData;

  const avatar = intentData.avatar || "assistant";
  const bot = BOT_MAP[avatar] || genericBot;

  /* ============================================================
     2) BOT PRINCIPALE (avatar target)
  ============================================================= */
  const mainResponse = await bot.run(cleanMsg, context);

  /* ============================================================
     3) COMPRESENZA — avatar secondari che intervengono
     Esempi:
     - Venditore parla → Influencer aggiunge hype
     - Professore parla → Venditore aggiunge un prodotto
     - Newsletter parla → Influencer suggerisce i social
  ============================================================= */
  const extraResponses = [];

  // Venditore → Influencer aggiunge hype
  if (avatar === "vendor") {
    const hype = await influencerBot.sidekick(cleanMsg, context);
    if (hype) extraResponses.push(hype);
  }

  // Professore → Venditore suggerisce un prodotto
  if (avatar === "professor") {
    const suggestion = await vendorBot.sidekick(cleanMsg, context);
    if (suggestion) extraResponses.push(suggestion);
  }

  // Newsletter → Influencer suggerisce i social
  if (avatar === "newsletter") {
    const pr = await influencerBot.sidekick(cleanMsg, context);
    if (pr) extraResponses.push(pr);
  }

  /* ============================================================
     4) OUTPUT — lista di messaggi JSON per il Game Engine
  ============================================================= */
  return [
    mainResponse,
    ...extraResponses
  ];
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  routeMessage
};
