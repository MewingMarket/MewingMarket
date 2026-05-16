/**
 * FILE: intent-engine.cjs
 * PATH: /app/modules/bot/intent-engine.cjs
 * VERSIONE: VIDEOGIOCO 2027 — PATCH COMPLETA
 *
 * Locale, deterministico, zero GPT.
 * Restituisce:
 *  - intent
 *  - avatar
 *  - productId
 *  - rawProduct
 *  - keywords
 *  - category
 *  - tutorial (guideKey + avatar + gender)
 *  - botOwner (per Router 2027)
 */

const path = require("path");
const {
  normalize,
  cleanSearchQuery,
  extractLinks
} = require(path.join(process.cwd(), "app/modules/utils.cjs"));

const {
  findProductFromText,
  findProductById
} = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));

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
  descrizione: ["descrizione", "dettagli", "spiega"],
  immagine: ["immagine", "foto", "anteprima"],

  trattativa: ["sconto", "troppo caro", "caro", "abbassa", "trattiamo"],
  obiezione: ["non so", "non sono sicuro", "dubbi"],

  video: ["video", "youtube", "tutorial"],
  motivazione: ["motivami", "ispirami", "hype"],

  /* PATCH 2027 — guida avanzata */
  guida: [
    "come si fa",
    "come funziona",
    "istruzioni",
    "tutorial",
    "spiegami come",
    "mostrami come",
    "guida"
  ],

  newsletter: ["newsletter", "email", "aggiornami"],
  download: ["download", "scaricare", "scarica"],
  ordini: ["ordini", "acquisti", "storico"],
  privacy: ["privacy"],
  termini: ["termini", "condizioni"],
  cookie: ["cookie"],
  supporto: ["supporto", "assistenza"],

  /* PATCH 2027 — missioni */
  missione_completata: ["missione completata", "ho finito", "completato"],

  /* PATCH 2027 — tutorial prodotto */
  tutorial_prodotto: ["tutorial prodotto", "video prodotto", "istruzioni prodotto"],

  /* PATCH 2027 — newsletter avanzata */
  newsletter_subscribe_confirm: ["iscrivimi", "voglio iscrivermi", "ok iscrizione"],
  newsletter_unsubscribe_confirm: ["disiscrivimi", "voglio disiscrivermi"],

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
  tutorial_prodotto: "professor",

  download: "professor",
  ordini: "professor",
  privacy: "professor",
  termini: "professor",
  cookie: "professor",
  supporto: "professor",

  newsletter: "newsletter",
  newsletter_subscribe_confirm: "newsletter",
  newsletter_unsubscribe_confirm: "newsletter",

  missione_completata: "vendor",

  generico: "assistant"
};

/* ============================================================
   3) RICONOSCIMENTO INTENT (locale)
============================================================ */
function detectIntent(text) {
  const t = cleanSearchQuery(text);

  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(k => t.includes(cleanSearchQuery(k)))) {
      return intent;
    }
  }

  return "generico";
}

/* ============================================================
   4) RICONOSCIMENTO PRODOTTO
============================================================ */
async function detectProduct(text) {
  const t = cleanSearchQuery(text);

  // ID esplicito
  const idMatch = t.match(/\b(\d{1,4})\b/);
  if (idMatch) {
    const p = await findProductById(Number(idMatch[1]));
    if (p) return p;
  }

  // fuzzy
  const p = await findProductFromText(text);
  if (p) return p;

  return null;
}

/* ============================================================
   5) PATCH 2027 — RICONOSCIMENTO GUIDA → guideKey
============================================================ */
function detectGuideKey(text) {
  const t = cleanSearchQuery(text);

  if (t.includes("scaricare") && t.includes("prodotto"))
    return "come-scaricare-un-prodotto";

  if (t.includes("newsletter"))
    return "come-funziona-la-newsletter";

  if (t.includes("ordini") || t.includes("acquisti"))
    return "come-vedere-i-miei-ordini";

  return null;
}

/* ============================================================
   6) INTENT ENGINE COMPLETO (PATCHATO)
============================================================ */
async function generateIntent(text, options = {}) {
  const localIntent = detectIntent(text);
  const product = await detectProduct(text);

  const keywords = cleanSearchQuery(text).split(" ").filter(w => w.length > 2);
  const category = product?.categoria || null;

  const botAvatar = AVATAR_MAP[localIntent] || "assistant";
  const gender = options.gender === "female" ? "female" : "male";

  const base = {
    raw: text,
    intent: localIntent,
    subintent: null,
    avatar: botAvatar,
    botOwner: botAvatar, // PATCH 2027 → Router usa questo
    productId: product?.id || null,
    rawProduct: product || null,
    category,
    keywords,
    confidence: 1,
    source: "local"
  };

  /* =====================================================
     PATCH 2027 — se è una guida → attiva tutorial video
  ====================================================== */
  if (localIntent === "guida" || localIntent === "tutorial_prodotto") {
    const guideKey = detectGuideKey(text);

    if (guideKey) {
      base.tutorial = {
        guideKey,
        botAvatar,
        gender
      };
    }
  }

  return base;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generateIntent,
  detectIntent,
  detectProduct,
  detectGuideKey
};
