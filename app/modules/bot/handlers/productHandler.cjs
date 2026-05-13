/**
 * modules/bot/handlers/productHandler.cjs — VERSIONE VIDEOGIOCO 2027
 * Product Helper — Vendor AI
 * Nessun HTML, solo JSON UI compatibile con Game Engine
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
   1) PRODOTTO PRINCIPALE (ricerca ID + fuzzy)
============================================================ */
async function productHandler(text, catalog = []) {
  log("PRODUCT_HANDLER", { text });

  if (!text) {
    return {
      type: "text",
      avatar: "vendor",
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
      avatar: "vendor",
      text: "Non ho trovato nessun prodotto con queste informazioni."
    };
  }

  // Risposta JSON UI (card prodotto)
  return {
    ...productCardJSON(product),
    avatar: "vendor"
  };
}

/* ============================================================
   2) DETTAGLI PRODOTTO (descrizione lunga)
============================================================ */
async function productDetailsHandler(product) {
  log("PRODUCT_DETAILS_HANDLER");

  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Dimmi quale prodotto vuoi approfondire."
    };
  }

  return {
    ...productDetailsJSON(product),
    avatar: "vendor"
  };
}

/* ============================================================
   3) IMMAGINE PRODOTTO
============================================================ */
async function productImageHandler(product) {
  log("PRODUCT_IMAGE_HANDLER");

  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Dimmi quale prodotto vuoi vedere."
    };
  }

  return {
    ...productImageJSON(product),
    avatar: "vendor"
  };
}

/* ============================================================
   4) TUTORIAL CARD (TV + video)
============================================================ */
function productTutorialCard(product) {
  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Dimmi quale prodotto vuoi approfondire."
    };
  }

  return {
    type: "tutorial_card",
    avatar: "vendor",
    title: `Tutorial: ${product.titolo_breve}`,
    steps: [
      "Guarda il video sulla TV",
      "Segui le istruzioni",
      "Applica subito ciò che impari"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: product.youtube_url
      }
    ]
  };
}

/* ============================================================
   EXPORT — Vendor AI
============================================================ */
module.exports = {
  productHandler,
  productDetailsHandler,
  productImageHandler,
  productTutorialCard
};
