/**
 * app/modules/premium/quickReplies.cjs — VERSIONE VIDEOGIOCO 2027
 * Quick replies premium per bot MewingMarket
 * Intent-driven, JSON UI, compatibile con Game Engine 2027
 */

const path = require("path");
const { normalizeProduct } = require(path.join(process.cwd(), "app/modules/premium/catalogo.cjs"));

/* ============================================================
   QUICK REPLIES PER PRODOTTO (intent-driven)
============================================================ */
function productQuickReplies(product) {
  if (!product) return [];

  const p = normalizeProduct(product);

  return [
    {
      label: "Dettagli completi",
      intent: "dettagli_prodotto",
      productId: p.id
    },
    {
      label: "Mostra immagine",
      intent: "immagine_prodotto",
      productId: p.id
    },
    {
      label: "Apri prodotto",
      intent: "prodotto",
      productId: p.id
    }
  ];
}

/* ============================================================
   QUICK REPLIES GENERALI (intent-driven)
============================================================ */
function generalQuickReplies() {
  return [
    { label: "Catalogo", intent: "catalogo" },
    { label: "Novità", intent: "novita" },
    { label: "Consigliami qualcosa", intent: "consigliami" }
  ];
}

/* ============================================================
   QUICK REPLIES PER CATEGORIA (intent-driven)
============================================================ */
function categoryQuickReplies(categories = []) {
  if (!Array.isArray(categories) || !categories.length) return [];

  return categories.map(cat => ({
    label: `Categoria: ${cat}`,
    intent: "categoria",
    category: cat
  }));
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  productQuickReplies,
  generalQuickReplies,
  categoryQuickReplies
};
