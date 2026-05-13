/**
 * Game Engine 2027 — Core loop NPC + JSON UI (PATCH COMPLETA)
 * Path: app/modules/bot/game-engine.cjs
 *
 * Compatibile con:
 * - intentEngine (locale + AI)
 * - router.bot.cjs
 * - NPC 2027
 * - Premium Modules
 * - FAQ / Guides (toFrame)
 * - Catalogo
 * - Memory
 * - Server 2027
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   MODULI CORE
============================================================ */
const intentEngine = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.bot.cjs"));

/* NPC */
const vendor = require(path.join(process.cwd(), "app/modules/bot/bots/vendor.bot.cjs"));
const professor = require(path.join(process.cwd(), "app/modules/bot/bots/professore.bot.cjs"));
const influencer = require(path.join(process.cwd(), "app/modules/bot/bots/influencer.bot.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter.bot.cjs"));
const generic = require(path.join(process.cwd(), "app/modules/bot/bots/generic.bot.cjs"));

/* Premium UI */
const Premium = require(path.join(process.cwd(), "app/modules/premium/index.cjs"));

/* Moduli esterni */
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));
const faq = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));
const memory = require(path.join(process.cwd(), "app/modules/memory.js"));
const ai = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   NORMALIZZAZIONE UI
============================================================ */
function normalizeResponse(ui = {}) {
  if (!ui.avatar) ui.avatar = "assistant";
  if (!ui.type) ui.type = "text";
  if (ui.type === "text" && typeof ui.text !== "string") ui.text = "";
  return ui;
}

/* ============================================================
   ENRICH — PREMIUM UI
============================================================ */
function enrichResponse(ui, context = {}) {
  const product = context.intent?.rawProduct || null;

  // Product card → quick replies
  if (ui.type === "product_card" && product && !ui.quick_replies) {
    ui.quick_replies = Premium.Quick.productQuickReplies(product);
  }

  // List → azioni base
  if (ui.type === "list" && ui.title && !ui.actions) {
    ui.actions = [{ label: "Torna al menu", intent: "menu" }];
  }

  return ui;
}

/* ============================================================
   SIDEKICK — COMPRESENZA NPC
============================================================ */
async function maybeAddSidekick(mainBot, mainUI, message, context) {
  const frames = [normalizeResponse(mainUI)];

  const vendorBot = vendor;
  const influencerBot = influencer;

  // Professore → Vendor suggerisce prodotti
  if (mainBot.name === "professor" && context.intent.rawProduct) {
    if (vendorBot?.sidekick) {
      const s = await vendorBot.sidekick(message, context);
      if (s) frames.push(normalizeResponse(s));
    }
  }

  // Vendor → Influencer aggiunge hype
  if (mainBot.name === "vendor") {
    if (influencerBot?.sidekick) {
      const s = await influencerBot.sidekick(message, context);
      if (s) frames.push(normalizeResponse(s));
    }
  }

  // Newsletter → Influencer aggiunge PR
  if (mainBot.name === "newsletter") {
    if (influencerBot?.sidekick) {
      const s = await influencerBot.sidekick(message, context);
      if (s) frames.push(normalizeResponse(s));
    }
  }

  return frames;
}

/* ============================================================
   LOOP PRINCIPALE — GAME ENGINE
============================================================ */
async function runGame(message, extraContext = {}) {
  const uid = extraContext.uid;

  /* 1) Intent Engine locale + AI */
  const localIntent = intentEngine.detect(message);
  const aiIntent = await ai.generateIntent(message, { uid });

  const intentObj = {
    ...localIntent,
    ...aiIntent,
    raw: message
  };

  const context = {
    ...extraContext,
    intent: intentObj,
    memory: memory.get(uid),
    catalogo,
    faq,
    guides
  };

  log("GAME_ENGINE_INTENT", intentObj);

  /* 2) Router → NPC */
  const botName = router.pickAvatar(intentObj);
  const bot = {
    vendor,
    professor,
    influencer,
    newsletter,
    generic
  }[botName] || generic;

  log("GAME_ENGINE_BOT", { bot: bot?.name });

  /* 3) NPC → UI JSON */
  const ui = await bot.run(message, context);

  /* 4) Normalizza + arricchisci */
  const enriched = enrichResponse(normalizeResponse(ui), context);

  /* 5) Sidekick */
  const frames = await maybeAddSidekick(bot, enriched, message, context);

  /* 6) Output finale */
  return frames;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  runGame
};
