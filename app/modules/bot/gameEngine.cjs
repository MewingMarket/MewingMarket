/**
 * Game Engine 2027 — Core loop NPC + JSON UI (PATCH COMPLETA)
 * Path: app/modules/bot/game-engine.cjs
 *
 * Compatibile con:
 * - intentEngine (locale)
 * - router.cjs
 * - NPC 2027
 * - Premium Modules
 * - FAQ / Guides
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
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.cjs"));

/* NPC — NOMI REALI */
const vendor = require(path.join(process.cwd(), "app/modules/bot/bots/vendor-bot.cjs"));
const professor = require(path.join(process.cwd(), "app/modules/bot/bots/professore-bot.cjs"));
const influencer = require(path.join(process.cwd(), "app/modules/bot/bots/influencer-bot.cjs"));
const newsletter = require(path.join(process.cwd(), "app/modules/bot/bots/newsletter-bot.cjs"));
const generic = require(path.join(process.cwd(), "app/modules/bot/bots/generic-bot.cjs"));

/* Premium UI */
const Premium = require(path.join(process.cwd(), "app/modules/premium/index.cjs"));

/* Moduli esterni */
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));
const faq = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));
const memory = require(path.join(process.cwd(), "app/modules/memory.cjs"));

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

  if (ui.type === "product_card" && product && !ui.quick_replies && Premium?.Quick?.productQuickReplies) {
    ui.quick_replies = Premium.Quick.productQuickReplies(product);
  }

  if (ui.type === "list" && ui.title && !ui.actions) {
    ui.actions = [{ label: "Torna al menu", intent: "menu" }];
  }

  return ui;
}

/* ============================================================
   SIDEKICK — COMPRESENZA NPC (Router 2027)
============================================================ */
async function maybeAddSidekick(mainBot, mainUI, message, context) {
  const frames = [normalizeResponse(mainUI)];

  if (typeof router.runSidekick === "function") {
    const sidekick = await router.runSidekick(mainBot.name, message, context);
    if (sidekick) frames.push(normalizeResponse(sidekick));
  }

  return frames;
}

/* ============================================================
   HANDOFF — quando un bot passa la palla a un altro
============================================================ */
async function maybeHandoff(frames, message, context) {
  if (!frames.length || typeof router.detectHandoff !== "function") return frames;

  const last = frames[frames.length - 1];
  const handoff = router.detectHandoff(last);

  if (!handoff || typeof router.getBotByName !== "function") return frames;

  const nextBot = router.getBotByName(handoff);
  if (!nextBot) return frames;

  const ui = await nextBot.run(message, context);
  frames.push(normalizeResponse(ui));

  return frames;
}

/* ============================================================
   LOOP PRINCIPALE — GAME ENGINE
   Compatibile con:
   - chiamata diretta: runGame(message, { uid, ... })
   - orchestratore: runGame(message, { uid, intent, memory, catalog, faq, guides, ... })
============================================================ */
async function runGame(message, extraContext = {}) {
  const uid = extraContext.uid;

  /* ------------------------------
     1) INTENT ENGINE
     - se extraContext.intent esiste, lo riusa
     - altrimenti genera con intentEngine.generateIntent
  ------------------------------ */
  let intentObj = extraContext.intent;

  if (!intentObj) {
    intentObj = await intentEngine.generateIntent(message, {
      uid,
      gender: extraContext.gender,
      botAvatar: extraContext.botAvatar
    });
  }

  /* ------------------------------
     2) CONTEXT COMPLETO
  ------------------------------ */
  const catalog =
    extraContext.catalog ||
    (typeof catalogo.getCatalog === "function"
      ? await catalogo.getCatalog()
      : undefined);

  const mem =
    extraContext.memory ||
    (uid ? memory.get(uid) : []);

  const context = {
    ...extraContext,
    intent: intentObj,
    memory: mem,
    catalog,
    faq: extraContext.faq || faq,
    guides: extraContext.guides || guides
  };

  log("GAME_ENGINE_INTENT", intentObj);

  /* ------------------------------
     3) ROUTER → BOT CORRETTO
  ------------------------------ */
  const botName = router.pickAvatar(intentObj);
  const bot = {
    vendor,
    professor,
    influencer,
    newsletter,
    generic
  }[botName] || generic;

  log("GAME_ENGINE_BOT", { bot: bot?.name });

  /* ------------------------------
     4) RISPOSTA PRINCIPALE NPC
  ------------------------------ */
  const ui = await bot.run(message, context);
  const enriched = enrichResponse(normalizeResponse(ui), context);

  /* ------------------------------
     5) COMPRESENZA (sidekick)
  ------------------------------ */
  let frames = await maybeAddSidekick(bot, enriched, message, context);

  /* ------------------------------
     6) HANDOFF (bot → altro bot)
  ------------------------------ */
  frames = await maybeHandoff(frames, message, context);

  /* ------------------------------
     7) OUTPUT FINALE
  ------------------------------ */
  return frames;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  runGame
};
