/**
 * modules/bot/gpt.cjs
 * GPT engine — versione per Router AI
 * Ora NON genera testo finale, ma solo INTENT JSON
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Motore AI universale
const callAI = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   SYSTEM PROMPT — versione INTENT ONLY
============================================================ */
const BASE_SYSTEM_PROMPT = `
Sei un motore di INTENT DETECTION.
NON generi testo umano.
NON generi risposte conversazionali.
NON generi markup.
NON generi emoji.

Il tuo unico compito è:
- capire l'intento dell'utente
- estrarre eventuali parametri (productId, topic, ecc.)
- restituire SOLO un JSON valido

Esempi di output validi:
{"intent":"recensioni","productId":12}
{"intent":"assistenza","topic":"download"}
{"intent":"video_motivazionale"}
{"intent":"prodotti_correlati","productId":5}

Se non capisci, restituisci:
{"intent":"generico"}
`;

/* ============================================================
   CALL GPT — versione INTENT ONLY
============================================================ */
async function callGPTIntent(userPrompt, memory = [], context = {}) {
  log("GPT_INTENT_START", { userPrompt, memory, context });

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      log("GPT_NO_KEY", "OPENROUTER_API_KEY mancante");
      return { intent: "generico" };
    }

    const response = await callAI({
      userPrompt,
      memory,
      extraSystem: BASE_SYSTEM_PROMPT,
      extraData: { context }
    });

    // PATCH: se la risposta NON è JSON valido → fallback
    try {
      const parsed = JSON.parse(response);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (err) {
      log("GPT_INTENT_PARSE_FAIL", response);
      return { intent: "generico" };
    }

    return { intent: "generico" };

  } catch (err) {
    log("GPT_INTENT_FATAL", err);
    return { intent: "generico" };
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = callGPTIntent;
