/**
 * Avatar Generico — Narratore / Onboarding / Fallback (2027)
 * Path: app/modules/bot/bots/generic-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers UI
const conv = require(path.join(process.cwd(), "app/modules/bot/handlers/conversation.cjs"));
const fb = require(path.join(process.cwd(), "app/modules/bot/handlers/fallback.cjs"));

/* ============================================================
   MATCH — il bot generico risponde SEMPRE come fallback
============================================================ */
function match() {
  return true;
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}, extras = {}) {
  log("GENERIC_RUN", {
    uid: context.uid,
    intent: context.intent?.intent,
    memory: context.memory?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";

  /* ============================================================
     1) SALUTI / ONBOARDING
  ============================================================= */
  if (intent === "saluto" || intent === "onboarding") {
    return conv.conversationGeneric();
  }

  /* ============================================================
     2) MENU PRINCIPALE
  ============================================================= */
  if (intent === "menu") {
    return conv.conversationMenu();
  }

  /* ============================================================
     3) FAQ (se Router AI ha trovato una FAQ)
  ============================================================= */
  if (intent === "faq" && extras.faq) {
    return fb.fallbackFAQ(extras.faq);
  }

  /* ============================================================
     4) GUIDA (se Router AI ha trovato una guida)
  ============================================================= */
  if (intent === "guida" && extras.guide) {
    return fb.fallbackGuide(extras.guide);
  }

  /* ============================================================
     5) PRODOTTO NON RICONOSCIUTO
     (Intent Engine ha trovato un prodotto ma non è compito del Vendor)
  ============================================================= */
  if (intent === "prodotto_sconosciuto" && extras.product) {
    return fb.fallbackProduct(extras.product);
  }

  /* ============================================================
     6) FALLBACK GENERICO
  ============================================================= */
  return fb.fallbackGeneric();
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "generic",
  avatar: "assistant",
  match,
  run
};
