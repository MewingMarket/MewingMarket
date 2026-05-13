/**
 * Venditore AI — Bot commerciale (2027)
 * Path: app/modules/bot/bots/vendor-bot.cjs
 */

const path = require("path");
const db = require("../../db/database.cjs");

const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const {
  productCardJSON,
  productDetailsJSON,
  productImageJSON
} = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));

/* ============================================================
   HELPERS DB
============================================================ */
async function getProductById(id) {
  const rows = await db.all("SELECT * FROM prodotti WHERE id = ?", [id]);
  return rows[0] || null;
}

async function getReviews(productId, limit = 5) {
  return await db.all(
    "SELECT * FROM feedback WHERE prodotto_id = ? ORDER BY created_at DESC LIMIT ?",
    [productId, limit]
  );
}

async function getRelated(productId, limit = 3) {
  return await db.all(
    `
    SELECT * FROM prodotti
    WHERE id != ?
    ORDER BY RANDOM()
    LIMIT ?
    `,
    [productId, limit]
  );
}

/* ============================================================
   MATCH — decide se il bot deve rispondere
   (basato su intent, NON sul testo)
============================================================ */
function match(intent) {
  return [
    "prodotto",
    "prezzo_prodotto",
    "recensioni",
    "prodotti_correlati",
    "dettagli_prodotto",
    "immagine_prodotto",
    "acquisto_diretto"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale del bot
============================================================ */
async function run(message, context = {}) {
  log("VENDOR_RUN", context);

  const intent = context.intent;
  const productId = context.productId || null;

  /* ============================================================
     1) RECENSIONI
  ============================================================ */
  if (intent === "recensioni") {
    if (!productId) {
      return {
        avatar: "sales_ai",
        type: "text",
        text: "Dimmi di quale prodotto vuoi vedere le recensioni."
      };
    }

    const product = await getProductById(productId);
    const reviews = await getReviews(productId);

    return {
      avatar: "sales_ai",
      type: "reviews_list",
      product: {
        id: product.id,
        title: product.nome
      },
      reviews: reviews.map(r => ({
        user: r.utente_id || "Utente",
        rating: r.rating,
        comment: r.commento
      })),
      actions: [
        { label: "Prodotti correlati", value: `prodotti_correlati ${product.id}` }
      ]
    };
  }

  /* ============================================================
     2) PRODOTTI CORRELATI
  ============================================================ */
  if (intent === "prodotti_correlati") {
    if (!productId) {
      return {
        avatar: "sales_ai",
        type: "text",
        text: "Dimmi prima un prodotto, poi ti mostro quelli correlati."
      };
    }

    const product = await getProductById(productId);
    const related = await getRelated(productId);

    return {
      avatar: "sales_ai",
      type: "products_list",
      title: `Prodotti correlati a ${product.nome}`,
      products: related.map(p => ({
        id: p.id,
        title: p.nome,
        price_cent: p.prezzo_cent
      })),
      actions: [
        { label: "Recensioni", value: `recensioni ${product.id}` }
      ]
    };
  }

  /* ============================================================
     3) PREZZO / PRODOTTO PRINCIPALE
  ============================================================ */
  if (intent === "prodotto" || intent === "prezzo_prodotto" || intent === "acquisto_diretto") {
    if (!productId) {
      return {
        avatar: "sales_ai",
        type: "text",
        text: "Quale prodotto ti interessa?"
      };
    }

    const product = await getProductById(productId);

    return {
      avatar: "sales_ai",
      type: "product_card",
      product: {
        id: product.id,
        title: product.nome,
        description: product.descrizione,
        price_cent: product.prezzo_cent
      },
      actions: [
        { label: "Recensioni", value: `recensioni ${product.id}` },
        { label: "Correlati", value: `prodotti_correlati ${product.id}` }
      ]
    };
  }

  /* ============================================================
     4) DETTAGLI PRODOTTO
  ============================================================ */
  if (intent === "dettagli_prodotto") {
    if (!productId) {
      return {
        avatar: "sales_ai",
        type: "text",
        text: "Dimmi quale prodotto vuoi approfondire."
      };
    }

    const product = await getProductById(productId);
    return productDetailsJSON(product);
  }

  /* ============================================================
     5) IMMAGINE PRODOTTO
  ============================================================ */
  if (intent === "immagine_prodotto") {
    if (!productId) {
      return {
        avatar: "sales_ai",
        type: "text",
        text: "Dimmi quale prodotto vuoi vedere."
      };
    }

    const product = await getProductById(productId);
    return productImageJSON(product);
  }

  /* ============================================================
     6) FALLBACK COMMERCIALE
  ============================================================ */
  return {
    avatar: "sales_ai",
    type: "quick_replies",
    text: "Come posso aiutarti a scegliere il prodotto giusto?",
    options: [
      { label: "Prodotti consigliati", value: "catalogo" },
      { label: "Recensioni", value: "recensioni" },
      { label: "Assistenza", value: "supporto" }
    ]
  };
}

module.exports = {
  name: "vendor",
  avatar: "sales_ai",
  match,
  run
};
