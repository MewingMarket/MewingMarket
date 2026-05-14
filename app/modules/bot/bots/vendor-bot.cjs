/**
 * Venditore AI — NPC commerciale (2027)
 * Path: app/modules/bot/bots/vendor-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Handlers
const catalogHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/catalogHandler.cjs"));
const productHandler = require(path.join(process.cwd(), "app/modules/bot/handlers/productHandler.cjs"));

// Premium Modules
const Premium = require(path.join(process.cwd(), "app/modules/premium/index.cjs"));

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
    "catalogo",

    // ⭐ PATCH PROMOZIONI
    "missione_completata"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}) {
  log("VENDOR_RUN", {
    uid: context.uid,
    intent: context.intent?.intent,
    productId: context.intent?.productId,
    catalogCount: context.catalog?.length || 0
  });

  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const productId = intentObj.productId || null;
  const catalog = context.catalog || [];

  /* ============================================================
     1) CATALOGO
  ============================================================= */
  if (intent === "catalogo") {
    return catalogHandler.catalogList(catalog);
  }

  /* ============================================================
     2) PRODOTTO PRINCIPALE
  ============================================================= */
  if (["prodotto", "prezzo", "prezzo_prodotto", "acquisto_diretto"].includes(intent)) {
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

    const p = catalog.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Non trovo questo prodotto."
      };
    }

    // Premium product card
    const card = Premium.Cards.productCard(p);

    // Aggiungo quick replies premium
    card.quick_replies = Premium.Quick.productQuickReplies(p);

    return card;
  }

  /* ============================================================
     ⭐ PATCH — 2.5) MISSIONE COMPLETATA → CREA PROMOZIONE
  ============================================================= */
  if (intent === "missione_completata") {
    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: "🎉 Missione completata!",
          text: "Hai completato la missione di vendita. Ora puoi ottenere la tua promozione personalizzata."
        },
        {
          title: "Ottieni la tua promozione",
          cta: {
            label: "Genera promozione",
            href: "/api/promo/genera"
          }
        }
      ]
    };
  }

  /* ============================================================
     3) DETTAGLI PRODOTTO
  ============================================================= */
  if (intent === "dettagli_prodotto") {
    const p = catalog.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Non trovo i dettagli di questo prodotto."
      };
    }

    return Premium.Cards.productDetailsCard(p);
  }

  /* ============================================================
     4) IMMAGINE PRODOTTO
  ============================================================= */
  if (intent === "immagine_prodotto") {
    const p = catalog.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Non trovo l'immagine di questo prodotto."
      };
    }

    return Premium.Cards.productImageCard(p);
  }

  /* ============================================================
     5) RECENSIONI (mock locale)
  ============================================================= */
  if (intent === "recensioni") {
    const p = catalog.find(x => x.id === productId);

    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Dimmi di quale prodotto vuoi vedere le recensioni."
      };
    }

    return Premium.Cards.productReviewsCard(p, [
      { user: "Utente A", rating: 5, comment: "Ottimo prodotto!" },
      { user: "Utente B", rating: 4, comment: "Molto utile." }
    ]);
  }

  /* ============================================================
     6) PRODOTTI CORRELATI
  ============================================================= */
  if (intent === "prodotti_correlati") {
    const p = catalog.find(x => x.id === productId);

    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Dimmi prima un prodotto, poi ti mostro quelli correlati."
      };
    }

    return Premium.Cross.crossSellByCategory(p, catalog);
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
  const product = context.intent?.rawProduct || null;

  if (!product) {
    return {
      avatar: "vendor",
      type: "text",
      text: "Se vuoi, posso mostrarti i prodotti più popolari."
    };
  }

  return {
    avatar: "vendor",
    type: "text",
    text: `Vuoi vedere prodotti simili a *${product.titolo_breve}*?`,
    actions: [
      { label: "Correlati", intent: "prodotti_correlati", productId: product.id }
    ]
  };
}

/* ============================================================
   EXPORT NPC
============================================================ */
module.exports = {
  name: "vendor",
  avatar: "vendor",
  match,
  run,
  sidekick
};
