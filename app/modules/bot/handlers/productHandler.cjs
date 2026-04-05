/**
 * modules/bot/handlers/productHandler.cjs — VERSIONE DEFINITIVA PATCHATA
 * Risposta prodotto dinamico per bot MewingMarket
 */

const path = require("path");
const {
  findProductFromText,
  findProductById,
  productReply,
  productLongReply,
  productImageReply
} = require(path.join(__dirname, "..", "catalogo.cjs"));

const { updateContext } = require(path.join(__dirname, "..", "context.cjs"));

/* ============================================================
   HANDLER PRODOTTO
============================================================ */
async function productHandler(ctx, text, catalog = []) {
  if (!text) return "Non ho capito quale prodotto intendi.";

  // 1) Prova ID
  const idMatch = text.match(/\b(\d{1,4})\b/);
  let product = null;

  if (idMatch) {
    product = findProductById(Number(idMatch[1]), catalog);
  }

  // 2) Prova fuzzy
  if (!product) {
    product = await findProductFromText(text, catalog);
  }

  if (!product) {
    return "Non ho trovato nessun prodotto con queste informazioni.";
  }

  // Aggiorna contesto
  updateContext(ctx, {
    intent: "prodotto",
    product,
    query: text
  });

  // Risposta premium PRO breve
  return productReply(product);
}

/* ============================================================
   HANDLER DETTAGLI (descrizione lunga)
============================================================ */
async function productDetailsHandler(ctx, catalog = []) {
  const product = ctx.last_product;

  if (!product) {
    return "Dimmi quale prodotto vuoi approfondire.";
  }

  return productLongReply(product);
}

/* ============================================================
   HANDLER IMMAGINE
============================================================ */
async function productImageHandler(ctx, catalog = []) {
  const product = ctx.last_product;

  if (!product) {
    return "Dimmi quale prodotto vuoi vedere.";
  }

  return productImageReply(product);
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  productHandler,
  productDetailsHandler,
  productImageHandler
};
