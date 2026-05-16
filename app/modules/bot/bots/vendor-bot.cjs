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

    // Missioni commerciali
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
     1) CATALOGO (missione: open_catalog)
  ============================================================= */
  if (intent === "catalogo") {
    const card = catalogHandler.catalogList(catalog);

    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: "📚 Catalogo prodotti",
          text: "Ecco i prodotti disponibili."
        },
        {
          title: "🎯 Missione",
          text: "Hai aperto il catalogo!"
        },
        {
          title: "Prodotti",
          text: card.html || "Lista prodotti non disponibile."
        }
      ]
    };
  }

  /* ============================================================
     2) PRODOTTO PRINCIPALE (missione: view_product)
  ============================================================= */
  if (["prodotto", "prezzo", "prezzo_prodotto", "acquisto_diretto"].includes(intent)) {
    if (!productId) {
      return {
        avatar: "vendor",
        type: "mission",
        blocks: [
          {
            title: "📦 Quale prodotto vuoi vedere?",
            text: "Scegli un prodotto dal catalogo."
          },
          {
            title: "🎯 Missione",
            text: "Apri un prodotto dal catalogo."
          }
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

    const card = Premium.Cards.productCard(p);

    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: `📦 ${p.titolo_breve}`,
          text: p.descrizione_breve
        },
        {
          title: "Prezzo",
          text: `${p.prezzo} €`
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato un prodotto!"
        },
        {
          title: "Apri scheda completa",
          cta: {
            label: "Dettagli prodotto",
            href: `/prodotto/${p.id}`
          }
        }
      ]
    };
  }

  /* ============================================================
     2.5) MISSIONE COMPLETATA → PROMOZIONE
  ============================================================= */
  if (intent === "missione_completata") {
    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: "🎉 Missione completata!",
          text: "Hai completato la missione di vendita."
        },
        {
          title: "🎁 Ricompensa",
          text: "Puoi ottenere una promozione personalizzata."
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
     3) DETTAGLI PRODOTTO (missione: view_product_details)
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

    const card = Premium.Cards.productDetailsCard(p);

    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: `📘 Dettagli: ${p.titolo_breve}`,
          text: card.html || "Dettagli non disponibili."
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato i dettagli di un prodotto!"
        }
      ]
    };
  }

  /* ============================================================
     4) IMMAGINE PRODOTTO (missione: view_product_image)
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

    const card = Premium.Cards.productImageCard(p);

    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: `🖼️ Immagine: ${p.titolo_breve}`,
          text: card.html || "Immagine non disponibile."
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato l’immagine di un prodotto!"
        }
      ]
    };
  }

  /* ============================================================
     5) RECENSIONI (missione: view_reviews)
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

    const card = Premium.Cards.productReviewsCard(p, [
      { user: "Utente A", rating: 5, comment: "Ottimo prodotto!" },
      { user: "Utente B", rating: 4, comment: "Molto utile." }
    ]);

    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: `⭐ Recensioni: ${p.titolo_breve}`,
          text: card.html || "Nessuna recensione disponibile."
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato le recensioni!"
        }
      ]
    };
  }

  /* ============================================================
     6) PRODOTTI CORRELATI (missione: view_related)
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

    const card = Premium.Cross.crossSellByCategory(p, catalog);

    return {
      avatar: "vendor",
      type: "mission",
      blocks: [
        {
          title: `🔗 Correlati a ${p.titolo_breve}`,
          text: card.html || "Nessun prodotto correlato trovato."
        },
        {
          title: "🎯 Missione",
          text: "Hai visualizzato prodotti correlati!"
        }
      ]
    };
  }

  /* ============================================================
     7) FALLBACK COMMERCIALE
  ============================================================= */
  return {
    avatar: "vendor",
    type: "mission",
    blocks: [
      {
        title: "Come posso aiutarti?",
        text: "• Catalogo<br>• Prezzi<br>• Recensioni<br>• Prodotti correlati"
      },
      {
        title: "🎯 Missione suggerita",
        text: "Apri il catalogo!"
      }
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
      type: "mission",
      blocks: [
        {
          title: "🛒 Suggerimento",
          text: "Se vuoi, posso mostrarti i prodotti più popolari."
        },
        {
          title: "🎯 Missione combo",
          text: "Parla con due NPC diversi nella stessa sessione."
        }
      ]
    };
  }

  return {
    avatar: "vendor",
    type: "mission",
    blocks: [
      {
        title: `🔍 Vuoi vedere prodotti simili a ${product.titolo_breve}?`,
        text: "Posso mostrarti alternative e correlati."
      },
      {
        title: "Apri correlati",
        cta: {
          label: "Prodotti correlati",
          href: `#prodotti_correlati_${product.id}`
        }
      }
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
