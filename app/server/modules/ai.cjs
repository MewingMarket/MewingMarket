// FILE: app/server/modules/ai.cjs
// PATH ASSOLUTO: app/server/modules/ai.cjs

/**
 * =========================================================
 * AI UNIVERSALE — MewingMarket
 * Versione 2027.1 — Esteso con:
 *  - generateText()
 *  - generateValidation()
 *  - generateImage()
 * Mantiene callGPT() come motore centrale.
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
   FUNZIONE PRINCIPALE — callGPT()
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

/* ============================================================
   FUNZIONE: generateText(prompt)
   - restituisce testo puro
============================================================ */
async function generateText(prompt) {
  const out = await callGPT({ userPrompt: prompt });
  return out || "";
}

/* ============================================================
   FUNZIONE: generateValidation(prompt)
   - restituisce JSON strutturato
============================================================ */
async function generateValidation(prompt) {
  const out = await callGPT({
    userPrompt: `
${prompt}

IMPORTANTE:
Rispondi SOLO in JSON valido con questa struttura:

{
  "titolo": "...",
  "categoria": "...",
  "trend_score": 0.0,
  "colore": "verde|giallo|rosso",
  "motivazione": "...",
  "note_ricerca": "..."
}
`
  });

  try {
    return JSON.parse(out);
  } catch {
    return {
      titolo: "Prodotto",
      categoria: "",
      trend_score: 0.3,
      colore: "giallo",
      motivazione: out || "",
      note_ricerca: ""
    };
  }
}

/* ============================================================
   FUNZIONE: generateImage(prompt)
   - restituisce base64 immagine
============================================================ */
async function generateImage(prompt) {
  try {
    const payload = {
      model: "stability/stable-diffusion-xl",
      prompt,
      size: "1024x1024"
    };

    const res = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      agent
    });

    const json = await res.json().catch(() => null);

    const base64 = json?.data?.[0]?.b64_json;
    return base64 || null;

  } catch (err) {
    console.error("❌ generateImage errore:", err);
    return null;
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  callGPT,
  generateText,
  generateValidation,
  generateImage
};
