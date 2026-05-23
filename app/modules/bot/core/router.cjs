/**
 * Router AI — VERSIONE VIDEOGIOCO 2027.4 (PATCH COMPLETA)
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
  generic: genericBot,
  assistant: genericBot // compatibilità retro
};

/* ============================================================
   pickAvatar() — versione 2027.4
   (compatibile con Intent Engine + Game Engine)
============================================================ */
function pickAvatar(intentObj = {}) {
  const avatar = intentObj.avatar;
  const owner = intentObj.botOwner;

  // 1) Avatar dichiarato dall’Intent Engine
  if (avatar && BOT_MAP[avatar]) {
    return avatar;
  }

  // 2) Bot owner (Intent Engine 2027.4)
  if (owner && BOT_MAP[owner]) {
    return owner;
  }

  // 3) Fallback → generic
  return "generic";
}

/* ============================================================
   route() — restituisce il bot corretto
============================================================ */
function route(intentObj = {}) {
  const avatar = pickAvatar(intentObj);
  return BOT_MAP[avatar] || genericBot;
}

/* ============================================================
   SIDEKICK ENGINE — compresenza automatica 2027.4
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

        // sidekick valido → deve avere almeno avatar + type
        if (res && res.avatar && res.type) {
          return res;
        }
      } catch {}
    }
  }

  return null;
}

/* ============================================================
   HANDOFF ENGINE — versione 2027.4
   Supporta:
   - actions[]
   - blocks[].cta
   - list.actions[]
   - product_card.quick_replies
============================================================ */
function detectHandoff(response) {
  if (!response) return null;

  // 1) actions dirette
  if (Array.isArray(response.actions)) {
    const a = response.actions.find(a => a.intent && BOT_MAP[a.intent]);
    if (a) return a.intent;
  }

  // 2) blocks con CTA
  if (Array.isArray(response.blocks)) {
    for (const b of response.blocks) {
      if (b?.cta?.intent && BOT_MAP[b.cta.intent]) {
        return b.cta.intent;
      }
    }
  }

  // 3) quick replies (product_card)
  if (Array.isArray(response.quick_replies)) {
    const q = response.quick_replies.find(q => q.intent && BOT_MAP[q.intent]);
    if (q) return q.intent;
  }

  return null;
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
