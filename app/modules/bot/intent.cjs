/**
 * modules/bot/intent.cjs — VERSIONE 2027
 * Intent Helper — supporto locale ai bot
 * NON sostituisce generateIntent() (AI)
 */

const path = require("path");

// Utils
const { normalize } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Catalogo (ricerca locale)
const {
  findProductFromText,
  findProductById
} = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

/* ============================================================
   INTENT LOCALI (fallback)
   — usati SOLO se generateIntent() non capisce
============================================================ */
const LOCAL_INTENTS = [
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
   FALLBACK INTENT DETECTION (locale)
   — usato SOLO se generateIntent() ritorna "generico"
============================================================ */
function detectLocalIntent(text = "") {
  const t = normalize(text);

  for (const intent of LOCAL_INTENTS) {
    if (intent.match.some(k => t.includes(normalize(k)))) {
      return intent.key;
    }
  }

  return null;
}

/* ============================================================
   RICONOSCIMENTO PRODOTTO (ID o fuzzy)
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
   INTENT COMPLETO (fallback)
   — usato SOLO se generateIntent() fallisce
============================================================ */
async function detectFullIntent(text, catalog = []) {
  const intent = detectLocalIntent(text);
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
  detectLocalIntent,
  detectProduct,
  detectFullIntent
};
