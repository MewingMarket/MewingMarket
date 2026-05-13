/**
 * modules/bot/intent-engine.cjs — VERSIONE 2027
 * Intent Engine locale — NO GPT, NO API
 * Filosofia videogioco: avatar + intent + subintent + parametri
 */

const path = require("path");
const { normalize, extractKeywords } = require("./utils.cjs");
const { findProductFromText, findProductById } = require("./catalogo.cjs");

/* ============================================================
   1) DEFINIZIONE INTENTI PRINCIPALI
============================================================ */
const INTENTS = {
  saluto: ["ciao", "hey", "buongiorno", "buonasera", "salve"],
  catalogo: ["catalogo", "prodotti", "lista", "novita", "novità"],
  prezzo: ["prezzo", "quanto costa", "costa"],
  recensioni: ["recensioni", "recensione", "opinioni"],
  correlati: ["correlati", "simili", "alternativa"],
  video: ["video", "youtube", "tutorial"],
  descrizione: ["descrizione", "dettagli", "spiega"],
  immagine: ["immagine", "foto", "anteprima"],
  trattativa: ["sconto", "troppo caro", "caro", "abbassa", "trattiamo"],
  obiezione: ["non so", "non sono sicuro", "dubbi"],
  motivazione: ["motivami", "ispirami", "hype"],
  guida: ["come si fa", "come funziona", "istruzioni", "tutorial"],
  newsletter: ["newsletter", "email", "aggiornami"],
  generico: []
};

/* ============================================================
   2) MAPPATURA INTENT → AVATAR
============================================================ */
const AVATAR_MAP = {
  saluto: "assistant",
  catalogo: "vendor",
  prezzo: "vendor",
  recensioni: "vendor",
  correlati: "vendor",
  video: "influencer",
  descrizione: "vendor",
  immagine: "vendor",
  trattativa: "vendor",
  obiezione: "vendor",
  motivazione: "influencer",
  guida: "professor",
  newsletter: "newsletter",
  generico: "assistant"
};

/* ============================================================
   3) RICONOSCIMENTO INTENT
============================================================ */
function detectIntent(text) {
  const t = normalize(text);

  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(k => t.includes(normalize(k)))) {
      return intent;
    }
  }

  return "generico";
}

/* ============================================================
   4) RICONOSCIMENTO PRODOTTO
============================================================ */
async function detectProduct(text, catalog = []) {
  const t = normalize(text);

  // ID esplicito
  const idMatch = t.match(/\b(\d{1,4})\b/);
  if (idMatch) {
    const p = findProductById(Number(idMatch[1]), catalog);
    if (p) return p;
  }

  // fuzzy
  const p = await findProductFromText(text, catalog);
  if (p) return p;

  return null;
}

/* ============================================================
   5) INTENT ENGINE COMPLETO
============================================================ */
async function generateIntent(text, catalog = []) {
  const intent = detectIntent(text);
  const product = await detectProduct(text, catalog);

  return {
    intent,
    subintent: null, // lo aggiungeremo dopo
    avatar: AVATAR_MAP[intent] || "assistant",
    productId: product?.id || null,
    rawProduct: product || null
  };
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generateIntent,
  detectIntent,
  detectProduct
};
