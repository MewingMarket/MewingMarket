/**
 * modules/bot/index.cjs
 * MAIN orchestrator — versione modulare, pulita, robusta
 */

const path = require("path");
const log = require("./utils.cjs").log;
const { reply, setState, generateUID, addEmojis, isYes } = require("./utils.cjs");
const detectIntent = require("./intent.cjs");
const callGPT = require("./gpt.cjs");
const transcribeAudio = require("./whisper.cjs");

// Handlers
const conversationHandler = require("./handlers/conversation.cjs");
const catalogHandler = require("./handlers/catalog.cjs");
const newsletterHandler = require("./handlers/newsletter.cjs");
const socialHandler = require("./handlers/social.cjs");
const legalHandler = require("./handlers/legal.cjs");
const supportHandler = require("./handlers/support.cjs");
const productHandler = require("./handlers/product.cjs");
const fallbackHandler = require("./handlers/fallback.cjs");

// External modules
const Context = require(path.join(__dirname, "..", "context.cjs"));
const Memory = require(path.join(__dirname, "..", "memory.cjs"));
const { getProducts } = require(path.join(__dirname, "..", "airtable.cjs"));

/* ============================================================
   HANDLE CONVERSATION — ENTRY POINT
   ============================================================ */
async function handleConversation(req, res) {
  try {
    const rawText = req?.body?.text || "";
    const uid = req?.uid || generateUID();

    const { intent, sub } = detectIntent(rawText);
    const pageContext = Context.get(req) || {};
    const state = req.userState || {};

    log("HANDLE_START", { uid, intent, sub, rawText });

    // Load products
    let PRODUCTS = [];
    try {
      PRODUCTS = getProducts() || [];
      log("PRODUCTS_LOADED", { count: PRODUCTS.length });
    } catch (err) {
      log("PRODUCTS_ERROR", err);
    }

    // Memory push
    try {
      Memory.push(uid, rawText);
      state.lastIntent = intent;
      log("MEMORY_PUSH", rawText);
    } catch (err) {
      log("MEMORY_ERROR", err);
    }

    // Routing
    switch (intent) {
      case "conversazione":
      case "menu":
        return conversationHandler(req, res, intent, sub, rawText, PRODUCTS);

      case "catalogo":
        return catalogHandler(req, res, rawText, PRODUCTS);

      case "newsletter":
        return newsletterHandler(req, res, sub, rawText);

      case "social":
      case "social_specifico":
        return socialHandler(req, res, intent, sub, rawText);

      case "privacy":
      case "termini":
      case "cookie":
        return legalHandler(req, res, intent, rawText);

      case "supporto":
        return supportHandler(req, res, sub, rawText);

      case "prodotto":
      case "acquisto_diretto":
      case "dettagli_prodotto":
      case "video_prodotto":
      case "prezzo_prodotto":
      case "trattativa":
      case "obiezione":
      case "allegato":
        return productHandler(req, res, intent, sub, rawText, PRODUCTS);

      default:
        return fallbackHandler(req, res, rawText);
    }
  } catch (err) {
    log("HANDLE_FATAL", err);
    return reply(res, "C’è stato un piccolo problema tecnico, ma sono qui.");
  }
}

/* ============================================================
   EXPORT
   ============================================================ */
module.exports = {
  handleConversation,
  detectIntent,
  callGPT,
  transcribeAudio,
  reply,
  generateUID,
  addEmojis
};
