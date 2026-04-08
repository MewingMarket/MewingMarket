/**
 * app/modules/premium/quickReplies.cjs — VERSIONE DEFINITIVA PATCHATA
 * Quick replies premium per bot MewingMarket
 * Compatibile con SQL, ID-based, descrizione PRO
 */

const path = require("path");

// PATCH: require assoluto
const { normalizeProduct } = require(path.join(process.cwd(), "app/modules/premium/catalogo.cjs"));

/* ============================================================
   QUICK REPLIES PER PRODOTTO
============================================================ */
function productQuickReplies(product) {
  if (!product) return [];

  const p = normalizeProduct(product);

  return [
    {
      title: "Dettagli completi",
      payload: `dettagli ${p.id}`
    },
    {
      title: "Mostra immagine",
      payload: `immagine ${p.id}`
    },
    {
      title: "Apri prodotto",
      payload: `apri ${p.id}`
    }
  ];
}

/* ============================================================
   QUICK REPLIES GENERALI
============================================================ */
function generalQuickReplies() {
  return [
    { title: "Catalogo", payload: "catalogo" },
    { title: "Novità", payload: "novità" },
    { title: "Consigliami qualcosa", payload: "consigliami" }
  ];
}

/* ============================================================
   QUICK REPLIES PER CATEGORIA
============================================================ */
function categoryQuickReplies(categories = []) {
  if (!Array.isArray(categories) || !categories.length) return [];

  return categories.map(cat => ({
    title: `Categoria: ${cat}`,
    payload: `categoria ${cat}`
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
