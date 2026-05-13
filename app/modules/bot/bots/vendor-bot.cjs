/**
 * Venditore AI — NPC commerciale (2027)
 * Path: app/modules/bot/bots/vendor.bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

const catalog = require(path.join(process.cwd(), "app/modules/bot/handlers/catalogHandler.cjs"));
const product = require(path.join(process.cwd(), "app/modules/bot/handlers/productHandler.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "prodotto",
    "prezzo",
    "prezzo_prodotto",
    "recensioni",
    "prodotti_correlati",
    "dettagli_prodotto",
    "immagine_prodotto",
    "acquisto_diretto",
    "catalogo"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale del bot
============================================================ */
async function run(message, context = {}) {
  log("VENDOR_RUN", context);

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const productId = intentObj.productId || null;
  const catalogList = context.catalog || [];

  /* ============================================================
     1) CATALOGO
  ============================================================= */
  if (intent === "catalogo") {
    return catalog.catalogList(catalogList);
  }

  /* ============================================================
     2) PRODOTTO PRINCIPALE
  ============================================================= */
  if (intent === "prodotto" || intent === "prezzo" || intent === "prezzo_prodotto" || intent === "acquisto_diretto") {
    if (!productId) {
      return {
        avatar: "vendor",
        type: "quick_replies",
        text: "Quale prodotto ti interessa?",
        options: [
          { label: "Catalogo", intent: "catalogo" },
          { label: "Prodotti consigliati", intent: "catalogo" }
        ]
      };
    }

    const p = catalogList.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Non trovo questo prodotto."
      };
    }

    return {
      ...product.productHandler(p.titolo_breve, catalogList),
      avatar: "vendor"
    };
  }

  /* ============================================================
     3) DETTAGLI PRODOTTO
  ============================================================= */
  if (intent === "dettagli_prodotto") {
    const p = catalogList.find(x => x.id === productId);
    return product.productDetailsHandler(p);
  }

  /* ============================================================
     4) IMMAGINE PRODOTTO
  ============================================================= */
  if (intent === "immagine_prodotto") {
    const p = catalogList.find(x => x.id === productId);
    return product.productImageHandler(p);
  }

  /* ============================================================
     5) RECENSIONI (mock locale)
  ============================================================= */
  if (intent === "recensioni") {
    const p = catalogList.find(x => x.id === productId);

    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Dimmi di quale prodotto vuoi vedere le recensioni."
      };
    }

    return {
      avatar: "vendor",
      type: "reviews_list",
      product: {
        id: p.id,
        title: p.titolo_breve
      },
      reviews: [
        { user: "Utente A", rating: 5, comment: "Ottimo prodotto!" },
        { user: "Utente B", rating: 4, comment: "Molto utile." }
      ],
      actions: [
        { label: "Correlati", intent: "prodotti_correlati", productId: p.id }
      ]
    };
  }

  /* ============================================================
     6) PRODOTTI CORRELATI (mock locale)
  ============================================================= */
  if (intent === "prodotti_correlati") {
    const p = catalogList.find(x => x.id === productId);

    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Dimmi prima un prodotto, poi ti mostro quelli correlati."
      };
    }

    const related = catalogList
      .filter(x => x.id !== p.id)
      .slice(0, 3);

    return {
      type: "carousel",
      avatar: "vendor",
      title: `Prodotti correlati a ${p.titolo_breve}`,
      items: related.map(r => ({
        id: r.id,
        title: r.titolo_breve,
        description: r.descrizione_breve,
        price_cent: r.prezzo_cent,
        image: r.immagine_url
      }))
    };
  }

  /* ============================================================
     7) FALLBACK COMMERCIALE
  ============================================================= */
  return {
    avatar: "vendor",
    type: "quick_replies",
    text: "Come posso aiutarti a scegliere il prodotto giusto?",
    options: [
      { label: "Catalogo", intent: "catalogo" },
      { label: "Prodotti consigliati", intent: "catalogo" },
      { label: "Assistenza", intent: "supporto" }
    ]
  };
}

/* ============================================================
   SIDEKICK — compresenza (quando parla il Professore)
============================================================ */
async function sidekick(message, context = {}) {
  return {
    avatar: "vendor",
    type: "text",
    text: "Se vuoi, posso mostrarti anche i prodotti correlati o le recensioni."
  };
}

module.exports = {
  name: "vendor",
  avatar: "vendor",
  match,
  run,
  sidekick
};
