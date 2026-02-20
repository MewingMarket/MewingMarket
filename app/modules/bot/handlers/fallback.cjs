/**
 * modules/bot/handlers/fallback.cjs
 * Gestione intent GPT (fallback conversazionale) — versione resiliente
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

module.exports = async function fallbackHandler(req, res, rawText) {
  log("HANDLER_FALLBACK", { rawText });

  const uid = req?.uid || "unknown_user";

  // ⭐ PATCH: aggiorna contesto automaticamente
  Context.update(uid, "fallback", null);

  // Recupero memoria e contesto
  const memory = Memory.get(uid) || [];
  const pageContext = Context.get(uid) || {};

  // Costruzione prompt dinamico e pulito
  let systemPrompt = `
Rispondi in modo naturale, utile e amichevole.
Se possibile, proponi una delle seguenti opzioni:
- vedere il catalogo
- chiedere supporto
- vedere i social
- tornare al menu
`;

  // Aggiungi memoria solo se esiste
  if (memory.length > 0) {
    systemPrompt += `\nMemoria conversazione: ${JSON.stringify(memory)}\n`;
  }

  // Aggiungi contesto solo se esiste
  if (pageContext && Object.keys(pageContext).length > 0) {
    systemPrompt += `\nContesto pagina: ${JSON.stringify(pageContext)}\n`;
  }

  // Chiamata GPT
  const enriched = await callGPT(
    rawText || "Fallback",
    memory,
    pageContext,
    systemPrompt.trim(),
    {}
  );

  return reply(res, enriched || "Non ho capito bene, vuoi vedere il menu?");
};
