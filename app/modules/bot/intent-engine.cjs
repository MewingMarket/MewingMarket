/**
 * Intent Engine — VERSIONE VIDEOGIOCO 2027
 * Locale, deterministico, zero GPT.
 * Restituisce: intent + avatar + productId + rawProduct + keywords + category
 */

const path = require("path");
const { normalize, extractKeywords } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const { findProductFromText, findProductById } = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

/* ============================================================
   1) INTENT DI BASE
============================================================ */
const INTENTS = {
  saluto: ["ciao", "hey", "buongiorno", "buonasera", "salve"],
  menu: ["menu", "aiuto", "help"],
  catalogo: ["catalogo", "prodotti", "lista", "novita", "novità"],
  prodotto: ["prodotto", "mostrami", "voglio", "cerca"],
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
  download: ["download", "scaricare", "scarica"],
  ordini: ["ordini", "acquisti", "storico"],
  privacy: ["privacy"],
  termini: ["termini", "condizioni"],
  cookie: ["cookie"],
  supporto: ["supporto", "assistenza"],
  generico: []
};

/* ============================================================
   2) INTENT → AVATAR
============================================================ */
const AVATAR_MAP = {
  saluto: "assistant",
  menu: "assistant",
  catalogo: "vendor",
  prodotto: "vendor",
  prezzo: "vendor",
  recensioni: "vendor",
  correlati: "vendor",
  descrizione: "vendor",
  immagine: "vendor",
  trattativa: "vendor",
  obiezione: "vendor",
  video: "influencer",
  motivazione: "influencer",
  guida: "professor",
  download: "professor",
  ordini: "professor",
  privacy: "professor",
  termini: "professor",
  cookie: "professor",
  supporto: "professor",
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

  const keywords = extractKeywords(text);
  const category = product?.categoria || null;

  return {
    intent,
    subintent: null,
    avatar: AVATAR_MAP[intent] || "assistant",
    productId: product?.id || null,
    rawProduct: product || null,
    category,
    keywords,
    confidence: 1
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
