/**
 * Game Engine 2027 — Core loop NPC + JSON UI
 * Path: app/modules/bot/gameEngine.cjs
 *
 * Nessun HTML, nessun GPT, solo:
 * - Intent Engine
 * - Router AI
 * - NPC bot (vendor, influencer, professor, newsletter, assistant)
 * - UI JSON WhatsApp-style
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Intent Engine (estrazione intent + parametri)
const intentEngine = require(path.join(process.cwd(), "app/modules/bot/intentEngine.cjs"));

// Router AI (sceglie quale NPC deve parlare)
const router = require(path.join(process.cwd(), "app/modules/bot/router.cjs"));

// Premium UI helpers (JSON only)
const Premium = require(path.join(process.cwd(), "app/modules/premium/index.cjs"));

/* ============================================================
   NORMALIZZAZIONE RISPOSTA UI
============================================================ */
function normalizeResponse(ui = {}) {
  // Default avatar
  if (!ui.avatar) ui.avatar = "assistant";

  // Default type
  if (!ui.type) ui.type = "text";

  // Garantisce struttura minima
  if (ui.type === "text" && typeof ui.text !== "string") {
    ui.text = "";
  }

  return ui;
}

/* ============================================================
   ENRICH — AGGIUNGE QUICK REPLIES / PREMIUM UI
============================================================ */
function enrichResponse(ui, context = {}) {
  const catalog = context.catalog || [];
  const product = context.product || null;

  // Se è una product_card e non ha quick replies → aggiungi quick replies premium
  if (ui.type === "product_card" && product && !ui.quick_replies) {
    ui.quick_replies = Premium.Quick.productQuickReplies(product);
  }

  // Se è una lista catalogo senza azioni → aggiungi azioni base
  if (ui.type === "list" && ui.title && !ui.actions) {
    ui.actions = [{ label: "Torna al menu", intent: "menu" }];
  }

  return ui;
}

/* ============================================================
   SIDEKICK HANDLER — COMPRESENZA NPC
============================================================ */
async function maybeAddSidekick(mainBot, mainUI, message, context) {
  // Se il bot principale è il Professore → il Vendor può intervenire
  if (mainBot.name === "professor" && context.product) {
    const vendorBot = router.getBotByName("vendor");
    if (vendorBot && typeof vendorBot.sidekick === "function") {
      const sidekickUI = await vendorBot.sidekick(message, context);
      return [normalizeResponse(mainUI), normalizeResponse(sidekickUI)];
    }
  }

  // Nessuna compresenza
  return [normalizeResponse(mainUI)];
}

/* ============================================================
   LOOP PRINCIPALE — GAME ENGINE
============================================================ */
async function runGame(message, extraContext = {}) {
  // 1) Intent Engine → estrae intent strutturato
  const intentObj = await intentEngine.detectIntent(message, extraContext);
  const context = {
    ...extraContext,
    intent: intentObj
  };

  log("GAME_ENGINE_INTENT", intentObj);

  // 2) Router AI → sceglie NPC
  const bot = router.route(intentObj);
  log("GAME_ENGINE_BOT", { bot: bot?.name });

  if (!bot || typeof bot.run !== "function") {
    return normalizeResponse({
      avatar: "assistant",
      type: "text",
      text: "Non so bene chi dovrebbe rispondere a questo. Vuoi vedere il menu?"
    });
  }

  // 3) NPC → genera UI JSON
  const ui = await bot.run(message, context);

  // 4) Normalizza + arricchisce UI
  const normalized = normalizeResponse(ui);
  const enriched = enrichResponse(normalized, context);

  // 5) Compresenza (sidekick)
  const frames = await maybeAddSidekick(bot, enriched, message, context);

  // 6) Output finale: uno o più frame UI
  return Array.isArray(frames) ? frames : [frames];
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  runGame
};
