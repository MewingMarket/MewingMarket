/**
 * Game Engine 2027 — Core loop NPC + JSON UI
 * Path: app/modules/bot/gameEngine.cjs
 *
 * Nessun HTML, nessun GPT, solo:
 * - Intent Engine 2027
 * - Router AI 2027
 * - NPC bot (vendor, influencer, professor, newsletter, assistant)
 * - UI JSON WhatsApp-style
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Intent Engine (estrazione intent + parametri)
const intentEngine = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));

// Router AI (sceglie quale NPC deve parlare)
const router = require(path.join(process.cwd(), "app/modules/bot/core/router.cjs"));

// Premium UI helpers (JSON only)
const Premium = require(path.join(process.cwd(), "app/modules/premium/index.cjs"));

/* ============================================================
   NORMALIZZAZIONE RISPOSTA UI
============================================================ */
function normalizeResponse(ui = {}) {
  if (!ui.avatar) ui.avatar = "assistant";
  if (!ui.type) ui.type = "text";
  if (ui.type === "text" && typeof ui.text !== "string") ui.text = "";
  return ui;
}

/* ============================================================
   ENRICH — AGGIUNGE QUICK REPLIES / PREMIUM UI
============================================================ */
function enrichResponse(ui, context = {}) {
  const product = context.intent.rawProduct || null;

  // Product card → aggiungi quick replies premium
  if (ui.type === "product_card" && product && !ui.quick_replies) {
    ui.quick_replies = Premium.Quick.productQuickReplies(product);
  }

  // Catalog list → aggiungi azioni base
  if (ui.type === "list" && ui.title && !ui.actions) {
    ui.actions = [{ label: "Torna al menu", intent: "menu" }];
  }

  return ui;
}

/* ============================================================
   SIDEKICK HANDLER — COMPRESENZA NPC
============================================================ */
async function maybeAddSidekick(mainBot, mainUI, message, context) {
  const frames = [normalizeResponse(mainUI)];

  const vendorBot = router.getBotByName("vendor");
  const influencerBot = router.getBotByName("influencer");

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
  // 1) Intent Engine → estrae intent strutturato
  const intentObj = await intentEngine.generateIntent(message, extraContext.catalog || []);
  const context = { ...extraContext, intent: intentObj };

  log("GAME_ENGINE_INTENT", intentObj);

  // 2) Router AI → sceglie NPC
  const bot = router.route(intentObj);
  log("GAME_ENGINE_BOT", { bot: bot?.name });

  if (!bot || typeof bot.run !== "function") {
    return [
      normalizeResponse({
        avatar: "assistant",
        type: "text",
        text: "Non so bene chi dovrebbe rispondere a questo. Vuoi vedere il menu?"
      })
    ];
  }

  // 3) NPC → genera UI JSON
  const ui = await bot.run(message, context);

  // 4) Normalizza + arricchisce UI
  const enriched = enrichResponse(normalizeResponse(ui), context);

  // 5) Compresenza (sidekick)
  const frames = await maybeAddSidekick(bot, enriched, message, context);

  // 6) Output finale: uno o più frame UI
  return frames;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  runGame
};
