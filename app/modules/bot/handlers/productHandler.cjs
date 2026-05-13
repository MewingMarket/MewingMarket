/**
 * modules/bot/handlers/productHandler.cjs — VERSIONE 2027
 * Product Helper — usato dal bot Vendor AI
 * Nessun HTML, solo JSON UI
 */

const path = require("path");
const {
  findProductFromText,
  findProductById,
  productCardJSON,
  productDetailsJSON,
  productImageJSON
} = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   PRODOTTO PRINCIPALE (ricerca ID + fuzzy)
============================================================ */
async function productHandler(text, catalog = []) {
  log("PRODUCT_HANDLER", { text });

  if (!text) {
    return {
      type: "text",
      avatar: "sales_ai",
      text: "Dimmi quale prodotto vuoi vedere."
    };
  }

  let product = null;

  // 1) Match ID
  const idMatch = text.match(/\b(\d{1,4})\b/);
  if (idMatch) {
    product = findProductById(Number(idMatch[1]), catalog);
  }

  // 2) Fuzzy search
  if (!product) {
    product = await findProductFromText(text, catalog);
  }

  if (!product) {
    return {
      type: "text",
      avatar: "sales_ai",
      text: "Non ho trovato nessun prodotto con queste informazioni."
    };
  }

  // Risposta JSON UI
  return productCardJSON(product);
}

/* ============================================================
   DETTAGLI PRODOTTO (descrizione lunga)
============================================================ */
async function productDetailsHandler(product) {
  log("PRODUCT_DETAILS_HANDLER");

  if (!product) {
    return {
      type: "text",
      avatar: "sales_ai",
      text: "Dimmi quale prodotto vuoi approfondire."
    };
  }

  return productDetailsJSON(product);
}

/* ============================================================
   IMMAGINE PRODOTTO
============================================================ */
async function productImageHandler(product) {
  log("PRODUCT_IMAGE_HANDLER");

  if (!product) {
    return {
      type: "text",
      avatar: "sales_ai",
      text: "Dimmi quale prodotto vuoi vedere."
    };
  }

  return productImageJSON(product);
}

/* ============================================================
   EXPORT — usato da Vendor AI
============================================================ */
module.exports = {
  productHandler,
  productDetailsHandler,
  productImageHandler
};
