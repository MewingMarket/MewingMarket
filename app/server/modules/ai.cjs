/**
 * =========================================================
 * AI UNIVERSALE — MewingMarket
 * Unico motore GPT per BOT + SITO + ADMIN + EMAIL
 * Blindato, robusto, con timeout e fallback
 * =========================================================
 */

const https = require("https");
const fetch = require("node-fetch");

/* ============================================================
   HTTPS AGENT — evita blocchi su Render
============================================================ */
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 10000
});

/* ============================================================
   SYSTEM PROMPT BASE
============================================================ */
const BASE_SYSTEM_PROMPT = `
Sei il Copilot ufficiale di MewingMarket.
Tono: chiaro, diretto, professionale, amichevole.
Regole:
- Non inventare prodotti.
- Non inventare prezzi.
- Non inventare dati tecnici.
- Non citare fonti inesistenti.
- Rispetta sempre il contesto fornito.
`;

/* ============================================================
   FUNZIONE PRINCIPALE
============================================================ */
async function callGPT({
  userPrompt = "",
  extraSystem = "",
  extraData = {},
  memory = []
} = {}) {

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return "⚠️ Errore tecnico: chiave AI mancante.";
    }

    const safeMemory = Array.isArray(memory) ? memory.slice(-6) : [];
    const data = extraData && typeof extraData === "object" ? extraData : {};

    let system = BASE_SYSTEM_PROMPT + "\n\n" + (extraSystem || "");

    if (safeMemory.length > 0) {
      system += `\n\nMemoria conversazione: ${JSON.stringify(safeMemory)}`;
    }

    if (Object.keys(data).length > 0) {
      system += `\n\nDati aggiuntivi: ${JSON.stringify(data)}`;
    }

    const payload = {
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: userPrompt.trim() }
      ]
    };

    /* TIMEOUT MANUALE */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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

    const json = await res.json().catch(() => null);

    const out = json?.choices?.[0]?.message?.content;
    if (out) return out.trim();

    return "⚠️ Risposta AI non disponibile al momento.";

  } catch (err) {
    return "⚠️ L’AI è temporaneamente non disponibile.";
  }
}

module.exports = callGPT;
