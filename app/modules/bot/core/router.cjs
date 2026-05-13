/**
 * Router AI — VERSIONE VIDEOGIOCO 2027
 * Smistamento avatar intelligente + compresenza + handoff
 * Path: app/modules/bot/core/router.cjs
 */

const path = require("path");

// NPC (bot)
const vendorBot = require(path.join(process.cwd(), "app/modules/bot/bots/vendor-bot.cjs"));
const professorBot = require(path.join(process.cwd(), "app/modules/bot/bots/professore-bot.cjs"));
const influencerBot = require(path.join(process.cwd(), "app/modules/bot/bots/influencer-bot.cjs"));
const newsletterBot = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter-bot.cjs"));
const genericBot = require(path.join(process.cwd(), "app/modules/bot/bots/generic-bot.cjs"));

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
   ROUTER PRINCIPALE — restituisce il bot corretto
============================================================ */
function route(intentObj = {}) {
  const avatar = intentObj.avatar || "assistant";
  return BOT_MAP[avatar] || genericBot;
}

/* ============================================================
   GET BOT BY NAME — usato dal Game Engine per compresenza
============================================================ */
function getBotByName(name) {
  return BOT_MAP[name] || null;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  route,
  getBotByName
};
