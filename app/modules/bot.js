// modules/bot.js

const {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  findProductFromText,
  listProductsByCategory,
  productReply,
  productLongReply,
  productImageReply
} = require("./catalogo");

const { normalize } = require("./utils");
const { getProducts } = require("./airtable");

// ------------------------------------------------------
// 🔥 TRACKING BOT (MAX MODE)
// ------------------------------------------------------
function trackBot(event, data = {}) {
  try {
    if (global.trackEvent) {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);
  }
}

// ------------------------------------------------------
// 🔥 GPT CALL (OPENROUTER + LLAMA 3.1 70B)
// ------------------------------------------------------
async function callGPT(prompt, memory = [], context = {}) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || "YOUR_OPENROUTER_API_KEY"}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "assistant", content: "Memoria recente: " + JSON.stringify(memory) },
          { role: "assistant", content: "Contesto pagina: " + JSON.stringify(context) },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "Non riesco a rispondere ora.";
  } catch (err) {
    console.error("GPT error:", err);
    return "Sto avendo un problema temporaneo. Riprova tra poco.";
  }
}

// ------------------------------------------------------
// 🔥 PROMPT GPT (MAX MODE)
// ------------------------------------------------------
const SYSTEM_PROMPT = `
Sei l'assistente ufficiale di MewingMarket.
Tono: professionale, diretto, chiaro, utile.
Non inventare prodotti.
Non essere prolisso.
Non usare emoji inutili.
Se l'utente chiede consigli, vendi in modo elegante.
Se l'utente chiede supporto, risolvi in modo tecnico e rapido.
Se l'utente chiede confronto, confronta in modo sintetico.
Se l'utente chiede idee, generane di pratiche.
Se l'utente chiede riscrittura, riscrivi in modo pulito.
`;

// ------------------------------------------------------
// 🔥 MEMORIA + CONTESTO (MAX MODE)
// ------------------------------------------------------
const memory = require("./memory");
const context = require("./context");

// ------------------------------------------------------
// STATO UTENTI (TUO CODICE INALTERATO)
// ------------------------------------------------------
const userStates = {};

function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

function setState(uid, newState) {
  userStates[uid].state = newState;
}

function reply(res, text) {
  trackBot("bot_reply", { text });
  res.json({ reply: text });
}

function isYes(text) {
  const t = text.toLowerCase();
  return (
    t.includes("si") ||
    t.includes("sì") ||
    t.includes("ok") ||
    t.includes("va bene") ||
    t.includes("certo") ||
    t.includes("yes")
  );
}// ------------------------------------------------------
// DETECT INTENT (TUO CODICE + INTENT GPT MAX MODE)
// ------------------------------------------------------

function detectIntent(rawText) {
  const t = normalize(rawText);
  const PRODUCTS = getProducts();

  // Tracking intent
  trackBot("bot_intent_detected", { text: rawText });

  // ------------------------------------------------------
  // 🔥 QUI VA IL TUO CODICE ORIGINALE DI detectIntent
  //     (lo incolli esattamente com'era)
  // ------------------------------------------------------

  // ------------------------------------------------------
  // 🔥 INTENT AVANZATI (MAX MODE)
  // ------------------------------------------------------

  // Confronto prodotti
  if (
    t.includes("confronta") ||
    t.includes("differenza") ||
    t.includes("meglio tra") ||
    t.includes("vs")
  ) {
    return { intent: "compare", sub: null };
  }

  // Idee / brainstorming
  if (
    t.includes("idee") ||
    t.includes("ispirami") ||
    t.includes("dammi idee") ||
    t.includes("brainstorming")
  ) {
    return { intent: "ideas", sub: null };
  }

  // Riscrittura testi
  if (
    t.includes("riscrivi") ||
    t.includes("migliora questo testo") ||
    t.includes("riformula")
  ) {
    return { intent: "rewrite", sub: null };
  }

  // Spiegazioni
  if (
    t.includes("spiega") ||
    t.includes("cos è") ||
    t.includes("come funziona")
  ) {
    return { intent: "explain", sub: null };
  }

  // Consulenza commerciale avanzata
  if (
    t.includes("consulenza") ||
    t.includes("aiutami a scegliere") ||
    t.includes("non so cosa prendere")
  ) {
    return { intent: "advisor", sub: null };
  }

  // Supporto tecnico avanzato
  if (
    t.includes("errore") ||
    t.includes("problema") ||
    t.includes("non funziona") ||
    t.includes("bug")
  ) {
    return { intent: "support_gpt", sub: null };
  }

  // ------------------------------------------------------
  // 🔥 FALLBACK GPT INTELLIGENTE (MAX MODE)
  // ------------------------------------------------------
  if (t.length > 3) {
    return { intent: "gpt", sub: null };
  }

  return { intent: "fallback", sub: null };
}// ------------------------------------------------------
// HANDLE CONVERSATION (TUO CODICE + GPT MAX MODE)
// ------------------------------------------------------

async function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const PRODUCTS = getProducts();

  // Inizializza stato utente
  if (!userStates[uid]) {
    userStates[uid] = { state: "menu", lastIntent: null, data: {}, memory: [] };
  }

  // Aggiorna memoria conversazionale (MAX MODE)
  memory.push(uid, rawText);

  // Aggiorna contesto pagina (MAX MODE)
  context.update(uid, req.body.page, req.body.slug);

  // Tracking messaggio
  trackBot("bot_message", { uid, text: rawText, intent });

  // ------------------------------------------------------
  // 🔥 QUI VA IL TUO CODICE ORIGINALE DI handleConversation
  //     (lo incolli esattamente com'era)
  // ------------------------------------------------------

  // ------------------------------------------------------
  // 🔥 AGENTI GPT (MAX MODE)
  // ------------------------------------------------------

  // 1) Confronto prodotti
  if (intent === "compare") {
    const risposta = await callGPT(
      `Confronta questi prodotti in modo chiaro e sintetico: ${rawText}`,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // 2) Idee / brainstorming
  if (intent === "ideas") {
    const risposta = await callGPT(
      `Genera idee pratiche e utili basate su questa richiesta: ${rawText}`,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // 3) Riscrittura testi
  if (intent === "rewrite") {
    const risposta = await callGPT(
      `Riscrivi questo testo in modo più chiaro e professionale: ${rawText}`,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // 4) Spiegazioni
  if (intent === "explain") {
    const risposta = await callGPT(
      `Spiega questo concetto in modo semplice e diretto: ${rawText}`,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // 5) Consulenza commerciale avanzata
  if (intent === "advisor") {
    const risposta = await callGPT(
      `L'utente chiede una consulenza commerciale. Analizza la richiesta e consiglia il prodotto migliore.`,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // 6) Supporto tecnico avanzato
  if (intent === "support_gpt") {
    const risposta = await callGPT(
      `L'utente ha un problema tecnico. Fornisci una soluzione chiara, rapida e precisa: ${rawText}`,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // ------------------------------------------------------
  // 🔥 FALLBACK GPT INTELLIGENTE (ULTIMA RISORSA)
  // ------------------------------------------------------
  if (intent === "gpt") {
    const risposta = await callGPT(
      rawText,
      memory.get(uid),
      context.get(uid)
    );
    return reply(res, risposta);
  }

  // ------------------------------------------------------
  // FALLBACK ORIGINALE (TUO)
  // ------------------------------------------------------
  return reply(res, `
Posso aiutarti con prodotti, supporto, newsletter o social.

Scrivi una parola chiave.
`);
                  }// ------------------------------------------------------
// EXPORT FINALE
// ------------------------------------------------------

module.exports = {
  detectIntent,
  handleConversation,
  generateUID
};
