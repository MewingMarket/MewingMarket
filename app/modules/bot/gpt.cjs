/**
 * modules/bot/gpt.cjs
 * GPT engine — versione blindata, robusta, con timeout e agent HTTPS
 */

const https = require("https");
const fetch = require("node-fetch");
const { addEmojis, log } = require("./utils.cjs");

/* ============================================================
   SYSTEM PROMPT BASE
============================================================ */
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket.
Tono: chiaro, diretto, professionale, amichevole.
Regole: non inventare prodotti, non inventare prezzi.
Usa markup WhatsApp-style.
`;

/* ============================================================
   HTTPS AGENT — evita blocchi su Render
============================================================ */
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 10000
});

/* ============================================================
   CALL GPT — versione blindata
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

    const safeMemory = Array.isArray(memory) ? memory.slice(-6) : [];
    const ctx = context && typeof context === "object" ? context : {};
    const data = extraData && typeof extraData === "object" ? extraData : {};

    // Costruisco un unico system prompt pulito
    let system = BASE_SYSTEM_PROMPT + (extraSystem || "");

    const extraBlocks = [];

    if (safeMemory.length > 0) {
      extraBlocks.push(`Memoria conversazione: ${JSON.stringify(safeMemory)}`);
    }

    if (Object.keys(ctx).length > 0) {
      extraBlocks.push(`Contesto pagina: ${JSON.stringify(ctx)}`);
    }

    if (Object.keys(data).length > 0) {
      extraBlocks.push(`Dati aggiuntivi: ${JSON.stringify(data)}`);
    }

    if (extraBlocks.length > 0) {
      system += "\n\n" + extraBlocks.join("\n");
    }

    const payload = {
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: userPrompt || "" }
      ]
    };

    log("GPT_PAYLOAD", payload);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      log("GPT_TIMEOUT", "Timeout raggiunto");
    }, 15000);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      agent,
      signal: controller.signal
    });

    clearTimeout(timeout);

    let json = null;
    try {
      json = await res.json();
    } catch (err) {
      log("GPT_JSON_ERROR", err);
      return addEmojis("Sto avendo un piccolo rallentamento, ma posso aiutarti.");
    }

    log("GPT_RESPONSE", json);

    const out = json?.choices?.[0]?.message?.content;

    if (out && typeof out === "string") {
      return addEmojis(out.trim());
    }

    log("GPT_EMPTY_RESPONSE", json);
    return addEmojis("Sto avendo un piccolo rallentamento, ma posso aiutarti.");
  } catch (err) {
    log("GPT_FATAL_ERROR", err);
    return addEmojis("C’è un piccolo problema tecnico, ma posso aiutarti.");
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = callGPT;
