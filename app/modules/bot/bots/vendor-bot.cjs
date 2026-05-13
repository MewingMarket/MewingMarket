/**
 * Venditore AI — Bot commerciale
 * Path: app/modules/bot/bots/vendor.bot.cjs
 */

const db = require("../../db/database.cjs"); // adatta se necessario

/* =========================================================
   HELPERS DB
========================================================= */

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

/* =========================================================
   MATCH — decide se il bot deve rispondere
========================================================= */

function match(message) {
  if (!message) return false;
  const m = message.toLowerCase();

  return (
    m.includes("prodotto") ||
    m.includes("prezzo") ||
    m.includes("quanto costa") ||
    m.includes("recensioni") ||
    m.includes("recensione") ||
    m.includes("correlati") ||
    m.includes("simili") ||
    m.includes("consigliami") ||
    m.includes("offerta")
  );
}

/* =========================================================
   RUN — logica principale del bot
========================================================= */

async function run(message, context = {}) {
  const m = message.toLowerCase();
  const productId = context.productId || context.lastProductId || null;

  /* --- RECENSIONI --- */
  if (m.includes("recensioni") || m.includes("recensione")) {
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
        utente: r.utente_id || "Utente",
        rating: r.rating,
        commento: r.commento
      })),
      actions: [
        { label: "Lascia recensione", intent: "lascia_recensione", productId },
        { label: "Prodotti correlati", intent: "prodotti_correlati", productId }
      ]
    };
  }

  /* --- CORRELATI --- */
  if (m.includes("correlati") || m.includes("simili")) {
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
      type: "card",
      layout: "products_list",
      title: `Prodotti correlati a ${product.nome}`,
      products: related.map(p => ({
        id: p.id,
        title: p.nome,
        price_cent: p.prezzo_cent
      })),
      actions: [
        { label: "Recensioni", value: `recensioni prodotto ${product.id}` },
        { label: "Mostra altro", value: "mostra altri prodotti" }
      ]
    };
  }

  /* --- PREZZO --- */
  if (m.includes("prezzo") || m.includes("quanto costa")) {
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
        { label: "Recensioni", value: `recensioni prodotto ${product.id}` },
        { label: "Correlati", value: `correlati ${product.id}` }
      ]
    };
  }

  /* --- FALLBACK COMMERCIALE --- */
  return {
    avatar: "sales_ai",
    type: "quick_replies",
    text: "Come posso aiutarti a scegliere il prodotto giusto?",
    options: [
      { label: "Mostra prodotti consigliati", value: "prodotti consigliati" },
      { label: "Voglio vedere le recensioni", value: "recensioni" },
      { label: "Ho bisogno di assistenza", value: "assistenza" }
    ]
  };
}

module.exports = {
  name: "Venditore AI",
  avatar: "sales_ai",
  match,
  run
};
