/**
 * Router AI — VERSIONE VIDEOGIOCO 2027 (PATCH COMPLETA)
 * Smistamento avatar intelligente + compresenza + handoff
 * Path: app/modules/bot/core/router.cjs
 */

const path = require("path");

/* ============================================================
   IMPORT NPC CORRETTI (nomi reali)
============================================================ */
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
  assistant: genericBot,
  generic: genericBot
};

/* ============================================================
   pickAvatar() — versione 2027
   (compatibile con Intent Engine + Game Engine)
============================================================ */
function pickAvatar(intentObj = {}) {
  const avatar = intentObj.avatar;
  const owner = intentObj.botOwner;

  // 1) Avatar dichiarato
  if (avatar && BOT_MAP[avatar]) {
    return avatar;
  }

  // 2) Bot owner (Intent Engine 2027)
  if (owner && BOT_MAP[owner]) {
    return owner;
  }

  // 3) Fallback
  return "assistant";
}

/* ============================================================
   route() — restituisce il bot corretto
============================================================ */
function route(intentObj = {}) {
  const avatar = pickAvatar(intentObj);
  return BOT_MAP[avatar] || genericBot;
}

/* ============================================================
   SIDEKICK ENGINE — compresenza automatica
   (Vendor + Influencer + Professore)
============================================================ */
async function runSidekick(mainBotName, message, context) {
  const sidekickOrder = ["influencer", "vendor", "professor"];

  for (const botName of sidekickOrder) {
    if (botName === mainBotName) continue;

    const bot = BOT_MAP[botName];
    if (bot && typeof bot.sidekick === "function") {
      try {
        const res = await bot.sidekick(message, context);
        if (res) return res;
      } catch {}
    }
  }

  return null;
}

/* ============================================================
   HANDOFF ENGINE — quando un bot passa la palla a un altro
============================================================ */
function detectHandoff(response) {
  if (!response) return null;

  const actions = response.actions || response.blocks || response.frames || [];

  if (!Array.isArray(actions)) return null;

  const action = actions.find(a => a.intent && BOT_MAP[a.intent]);
  return action ? action.intent : null;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  pickAvatar,
  route,
  getBotByName: name => BOT_MAP[name] || null,
  runSidekick,
  detectHandoff
};
