/**
 * modules/bot/context.cjs — VERSIONE 2027
 * Gestione contesto conversazionale per Router AI + Bot
 * Compatibile con catalogo SQL e intent AI
 */

const path = require("path");

const {
  normalizeProduct,
  findProductById,
  findProductFromText
} = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

/* ============================================================
   CREA CONTESTO
   — struttura minimale, deterministica
============================================================ */
function createContext() {
  return {
    intent: null,            // ultimo intento AI
    productId: null,         // ultimo prodotto usato
    product: null,           // oggetto prodotto
    query: null,             // ultimo testo utente
    history: []              // log conversazionale
  };
}

/* ============================================================
   AGGIORNA CONTESTO
   — chiamato dal Router AI dopo generateIntent()
============================================================ */
function updateContext(ctx, data = {}) {
  if (!ctx) return;

  if (data.intent) ctx.intent = data.intent;
  if (data.query) ctx.query = data.query;

  if (data.product) {
    ctx.product = normalizeProduct(data.product);
    ctx.productId = ctx.product?.id || null;
  }

  ctx.history.push({
    ts: Date.now(),
    ...data
  });
}

/* ============================================================
   RECUPERA PRODOTTO DAL CONTESTO
   — usato dai bot (Venditore AI, Professore AI, ecc.)
============================================================ */
async function getContextProduct(ctx, catalog = []) {
  if (!ctx) return null;

  // Caso 1: ID esplicito
  if (ctx.productId) {
    const p = findProductById(ctx.productId, catalog);
    if (p) return p;
  }

  // Caso 2: fuzzy search sull’ultima query
  if (ctx.query) {
    const p = await findProductFromText(ctx.query, catalog);
    if (p) return p;
  }

  return null;
}

/* ============================================================
   RESET CONTESTO
============================================================ */
function resetContext(ctx) {
  if (!ctx) return;

  ctx.intent = null;
  ctx.productId = null;
  ctx.product = null;
  ctx.query = null;
  ctx.history = [];
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  createContext,
  updateContext,
  getContextProduct,
  resetContext
};
