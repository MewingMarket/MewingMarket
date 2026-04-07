/**
 * modules/bot/gpt.cjs
 * GPT engine — versione blindata, robusta, con timeout e agent HTTPS
 * PATCH: ora usa il motore AI universale (ai.cjs)
 */

const { addEmojis, log } = require("./utils.cjs");

// 🔥 Nuovo motore AI universale
// PATCH: percorso corretto → ai.cjs deve stare in app/modules/
const callAI = require("../ai.cjs");

/* ============================================================
   SYSTEM PROMPT BASE (solo per il BOT)
============================================================ */
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket.
Tono: chiaro, diretto, professionale, amichevole.
Regole: non inventare prodotti, non inventare prezzi.
Usa markup WhatsApp-style.
`;

/* ============================================================
   CALL GPT — versione blindata (BOT WRAPPER)
============================================================ */
async function callGPT(
  userPrompt,
  memory = [],
  context = {},
  extraSystem = "",
  extraData = {}
) {
  log("GPT_CALL_START", { userPrompt, memory, context, extraSystem, extraData });

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      log("GPT_NO_KEY", "OPENROUTER_API_KEY mancante");
      return addEmojis("Sto avendo un problema tecnico, ma posso aiutarti.");
    }

    /* ============================================================
       PATCH: risposte brevi senza GPT (evita bug OpenRouter)
    ============================================================= */
    const short = (userPrompt || "").trim().toLowerCase();
    if (["ciao", "hey", "hi", "salve", "menu", "ok"].includes(short)) {
      return addEmojis("Ciao! 👋 Come posso aiutarti oggi?");
    }

    /* ============================================================
       Chiamata al nuovo motore AI universale
    ============================================================= */
    const response = await callAI({
      userPrompt,
      memory,
      extraSystem: BASE_SYSTEM_PROMPT + (extraSystem || ""),
      extraData: {
        ...extraData,
        context
      }
    });

    return addEmojis(response);

  } catch (err) {
    log("GPT_FATAL_ERROR", err);
    return addEmojis("C’è un piccolo problema tecnico, ma posso aiutarti.");
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = callGPT;
