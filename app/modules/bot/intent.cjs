/**
 * modules/bot/intent.cjs — VERSIONE DEFINITIVA PATCHATA
 * Intent detection premium per bot MewingMarket
 * Compatibile con SQL, ID-based, descrizione PRO
 */

const path = require("path");

// PATCH: require assoluti
const { normalize } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const {
  findProductFromText,
  findProductById
} = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

/* ============================================================
   INTENT BASE
============================================================ */
const INTENTS = [
  { key: "saluto",      match: ["ciao", "hey", "buongiorno", "buonasera"] },
  { key: "catalogo",    match: ["catalogo", "prodotti", "lista", "novità"] },
  { key: "aiuto",       match: ["aiuto", "help", "non so", "come funziona"] },
  { key: "prezzo",      match: ["quanto costa", "prezzo", "costa"] },
  { key: "video",       match: ["video", "youtube", "anteprima"] },
  { key: "descrizione", match: ["descrizione", "spiega", "dettagli"] },
  { key: "immagine",    match: ["immagine", "foto", "anteprima"] },
  { key: "acquisto",    match: ["comprare", "acquista", "prendo", "checkout"] }
];

/* ============================================================
   RICONOSCIMENTO INTENT
============================================================ */
function detectIntent(text = "") {
  const t = normalize(text);

  for (const intent of INTENTS) {
    if (intent.match.some(k => t.includes(normalize(k)))) {
      return intent.key;
    }
  }

  return null;
}

/* ============================================================
   RICONOSCIMENTO PRODOTTO (ID o testo)
============================================================ */
async function detectProduct(text, catalog = []) {
  if (!text) return null;

  const t = normalize(text);

  // Caso: ID esplicito
  const idMatch = t.match(/\b(\d{1,4})\b/);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const p = findProductById(id, catalog);
    if (p) return p;
  }

  // Caso: ricerca fuzzy
  const p = await findProductFromText(text, catalog);
  if (p) return p;

  return null;
}

/* ============================================================
   INTENT COMPLETO (intent + prodotto)
============================================================ */
async function detectFullIntent(text, catalog = []) {
  const intent = detectIntent(text);
  const product = await detectProduct(text, catalog);

  return {
    intent,
    product
  };
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  detectIntent,
  detectProduct,
  detectFullIntent
};
