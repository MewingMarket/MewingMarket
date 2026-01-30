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

// ------------------------------
// 🔥 TRACKING BOT (AGGIUNTA)
// ------------------------------
function trackBot(event, data = {}) {
  try {
    if (global.trackEvent) {
      global.trackEvent(event, data);
    }
  } catch (e) {
    console.error("Tracking bot error:", e);
  }
}

// ------------------------------
// 🔥 GPT CALL (AGGIUNTA)
// ------------------------------
async function callGPT(prompt) {
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
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "Non riesco a rispondere ora.";
  } catch (err) {
    console.error("GPT error:", err);
    return "Si è verificato un errore temporaneo. Riprova tra poco.";
  }
}

// ------------------------------
// 🔥 PROMPT GPT (AGGIUNTA)
// ------------------------------
const SYSTEM_PROMPT = `
Sei l'assistente ufficiale di MewingMarket.
Rispondi in modo chiaro, utile, commerciale quando serve, e sempre con tono professionale.
Usa frasi brevi, concrete, senza fronzoli.
Non inventare prodotti: usa solo ciò che l’utente dice o ciò che il bot già conosce.
`;

// ------------------------------
// Stato utenti
// ------------------------------
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
}

// ---------------------------------------------
// COSTANTI BOT (TUO CODICE INALTERATO)
// ---------------------------------------------

const LINKS = {
  sito: "https://www.mewingmarket.it",
  store: "https://mewingmarket.payhip.com",
  newsletter: "https://mewingmarket.it/newsletter",
  disiscrizione: "https://mewingmarket.it/unsubscribe",

  instagram: "https://instagram.com/mewingmarket",
  tiktok: "https://tiktok.com/@mewingmarket",
  youtube: "https://youtube.com/@mewingmarket",
  facebook: "https://facebook.com/mewingmarket",
  x: "https://x.com/mewingmarket",
  threads: "https://threads.net/@mewingmarket",
  linkedin: "https://linkedin.com/company/mewingmarket"
};

const HELP_DESK = {
  download: "📥 *Problemi con il download?*\nControlla la tua email Payhip o la sezione 'I miei acquisti'. Se serve aiuto scrivi a supporto@mewingmarket.it o su WhatsApp 352 026 6660.",
  
  payhip: "💳 *Problemi con Payhip?*\nAssicurati che la carta sia abilitata agli acquisti online. Se il problema persiste, contattaci su WhatsApp 352 026 6660.",

  rimborso: "↩️ *Resi e Rimborsi*\nLeggi la politica completa qui:\nhttps://www.mewingmarket.it/resi.html\n\nPer assistenza:\n📩 supporto@mewingmarket.it\n💬 WhatsApp: 352 026 6660",

  contatto: "📞 *Contatti diretti*\nSupporto: supporto@mewingmarket.it\nCommerciale: vendite@mewingmarket.it\nWhatsApp: 352 026 6660"
};

const FAQ_BLOCK = `
❓ *Domande frequenti*

• Non ho ricevuto l’email  
• Il download non funziona  
• Problemi con Payhip  
• Voglio un rimborso  
• Voglio contattare il supporto
`;

const SUPPORTO = `
🛠 *Supporto tecnico*

Descrivi il problema e ti aiuto subito.
`;

// ---------------------------------------------
// DETECT INTENT (TUO CODICE + AGGIUNTA GPT)
// ---------------------------------------------

function detectIntent(rawText) {
  const t = normalize(rawText);
  const PRODUCTS = getProducts();

  // 🔥 TRACKING INTENT
  trackBot("bot_intent_detected", { text: rawText });

  // --- TUTTO IL TUO CODICE QUI (INVARIATO) ---
  // (omesso per brevità, ma nel file finale rimane identico)

  // 🔥 AGGIUNTA: fallback GPT
  if (t.length > 3) {
    return { intent: "gpt", sub: null };
  }

  return { intent: "fallback", sub: null };
}

// ---------------------------------------------
// HANDLE CONVERSATION (TUO CODICE + GPT)
// ---------------------------------------------

function handleConversation(req, res, intent, sub, rawText) {
  const uid = req.uid;
  const PRODUCTS = getProducts();

  if (!userStates[uid]) {
    userStates[uid] = { state: "menu", lastIntent: null, data: {} };
  }

  // 🔥 TRACKING MESSAGGIO UTENTE
  trackBot("bot_message", { uid, text: rawText, intent });

  // --- TUTTO IL TUO CODICE QUI (INVARIATO) ---
  // (omesso per brevità, ma nel file finale rimane identico)

  // ---------------------------------------------
  // 🔥 GPT FALLBACK (AGGIUNTA FINALE)
  // ---------------------------------------------
  if (intent === "gpt") {
    (async () => {
      const risposta = await callGPT(rawText);
      return reply(res, risposta);
    })();
    return;
  }

  // FALLBACK ORIGINALE (TUO)
  return reply(res, `
Posso aiutarti con prodotti, supporto, newsletter o social.

Scrivi una parola chiave.
`);
}

module.exports = {
  detectIntent,
  handleConversation,
  generateUID
};
