/**
 * modules/bot/context.cjs — VERSIONE 2027 (PATCH COMPLETA)
 * Gestione contesto conversazionale per Router AI + Bot + Game Engine
 * Compatibile con catalogo SQL, intent AI e NPC 2027
 */

const path = require("path");

/* ============================================================
   IMPORT CORRETTI (catalogo reale)
============================================================ */
const {
  findProductById,
  findProductFromText
} = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));

/* Normalizzazione prodotto (fallback) */
function normalizeProduct(p) {
  if (!p || typeof p !== "object") return null;

  return {
    id: p.id || null,
    titolo: p.titolo || "",
    titolo_breve: p.titolo_breve || p.titolo || "",
    descrizione_breve: p.descrizione_breve || "",
    descrizione_lunga: p.descrizione_lunga || "",
    prezzo_cent: p.prezzo_cent || 0,
    immagine_url: p.immagine_url || "",
    categoria: Array.isArray(p.categoria) ? p.categoria : [],
    youtube_url: p.youtube_url || "",
    youtube_description: p.youtube_description || "",
    catalog_video_block: p.catalog_video_block || ""
  };
}

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
async function getContextProduct(ctx) {
  if (!ctx) return null;

  // Caso 1: ID esplicito
  if (ctx.productId) {
    const p = await findProductById(ctx.productId);
    if (p) return normalizeProduct(p);
  }

  // Caso 2: fuzzy search sull’ultima query
  if (ctx.query) {
    const p = await findProductFromText(ctx.query);
    if (p) return normalizeProduct(p);
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
