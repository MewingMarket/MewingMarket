/**
 * modules/bot/handlers/fallback.cjs
 * Gestione intent GPT (fallback conversazionale)
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   FALLBACK GPT (VERSIONE RESILIENTE)
============================================================ */
module.exports = async function fallbackHandler(req, res, rawText) {
  log("HANDLER_FALLBACK", { rawText });

  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const enriched = await callGPT(
    rawText || "Fallback",
    Memory.get(uid),
    pageContext,
    `
Rispondi in modo naturale, utile e amichevole.
Se possibile, proponi una delle seguenti opzioni:
- vedere il catalogo
- chiedere supporto
- vedere i social
- tornare al menu
`,
    {}
  );

  // ⭐ PATCH: reply ora gestisce sia Express che modalità interna
  return reply(res, enriched || "Non ho capito bene, vuoi vedere il menu?");
};
