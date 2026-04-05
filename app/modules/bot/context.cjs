/**
 * modules/bot/context.cjs — VERSIONE DEFINITIVA PATCHATA
 * Gestione contesto conversazionale del bot
 * Compatibile con catalogo SQL, ID-based, descrizione PRO
 */

const path = require("path");
const {
  normalizeProduct,
  findProductById,
  findProductFromText
} = require(path.join(__dirname, "catalogo.cjs"));

/* ============================================================
   STRUTTURA CONTESTO
============================================================ */
function createContext() {
  return {
    last_intent: null,
    last_product_id: null,
    last_product: null,
    last_query: null,
    history: []
  };
}

/* ============================================================
   AGGIORNA CONTESTO
============================================================ */
function updateContext(ctx, data = {}) {
  if (!ctx) return;

  if (data.intent) ctx.last_intent = data.intent;
  if (data.query) ctx.last_query = data.query;

  if (data.product) {
    ctx.last_product = normalizeProduct(data.product);
    ctx.last_product_id = ctx.last_product?.id || null;
  }

  ctx.history.push({
    ts: Date.now(),
    ...data
  });
}

/* ============================================================
   RECUPERA PRODOTTO DAL CONTESTO
============================================================ */
async function getContextProduct(ctx, catalog = []) {
  if (!ctx) return null;

  // Se abbiamo ID → recupero diretto
  if (ctx.last_product_id) {
    const p = findProductById(ctx.last_product_id, catalog);
    if (p) return p;
  }

  // Se abbiamo testo → fuzzy
  if (ctx.last_query) {
    const p = findProductFromText(ctx.last_query, catalog);
    if (p) return p;
  }

  return null;
}

/* ============================================================
   RESET CONTESTO
============================================================ */
function resetContext(ctx) {
  if (!ctx) return;
  ctx.last_intent = null;
  ctx.last_product_id = null;
  ctx.last_product = null;
  ctx.last_query = null;
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
