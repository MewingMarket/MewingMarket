/**
 * modules/bot/index.cjs
 * MAIN orchestrator — versione modulare, pulita, robusta
 */

const path = require("path");

// Utils
const utils = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const { reply, setState, generateUID, addEmojis, isYes } = utils;
const log = global.logBot || console.log;

// Core
const detectIntent = require(path.join(process.cwd(), "app/modules/bot/intent.cjs"));
const callGPT = require(path.join(process.cwd(), "app/modules/bot/gpt.cjs"));
const transcribeAudio = require(path.join(process.cwd(), "app/modules/bot/whisper.cjs"));

// Handlers (assoluti blindati)
const conversationHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/conversation.cjs"));
const catalogHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/catalogHandler.cjs"));
const newsletterHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/newsletter.cjs"));
const socialHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/social.cjs"));
const legalHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/legal.cjs"));
const supportHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/support.cjs"));
const productHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/productHandler.cjs"));
const fallbackHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/fallback.cjs"));

// External modules (assoluti blindati)
const Context = require(path.join(process.cwd(), "app/modules/bot/context.cjs"));
const Memory = require(path.join(process.cwd(), "app/modules/memory.cjs"));
const { getCatalog } = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

/* ============================================================
   HANDLE CONVERSATION — ENTRY POINT
============================================================ */
async function handleConversation(req, res) {
  try {
    const rawText = req?.body?.message || req?.body?.text || "";

    // UID persistente
    const uid = req?.uid || generateUID();
    req.uid = uid;

    const { intent, sub } = detectIntent(rawText);
    const pageContext = Context.get(req) || {};
    const state = req.userState || {};

    log("HANDLE_START", { uid, intent, sub, rawText });

    /* ⭐ READY SYSTEM — blocca risposte premature */
    if (!global.catalogReady) {
      return reply(res, "Sto pensando… un attimo 😄");
    }

    // Carichiamo i prodotti (blindato)
    let PRODUCTS = [];
    try {
      PRODUCTS = await getCatalog() || [];
      log("PRODUCTS_LOADED", { count: PRODUCTS.length });
    } catch (err) {
      log("PRODUCTS_ERROR", err);
    }

    // Memory push
    try {
      if (rawText.trim() !== "") {
        Memory.push(uid, rawText);
      }
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
