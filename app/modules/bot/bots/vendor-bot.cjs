/**
 * Venditore AI — NPC commerciale (2027)
 * Path: app/modules/bot/bots/vendor-bot.cjs
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

// Premium Modules
const Premium = require(path.join(process.cwd(), "app/modules/premium/index.cjs"));

/* ============================================================
   MATCH — basato su INTENT Engine 2027
============================================================ */
function match(intentObj) {
  const intent = intentObj?.intent || "generico";

  return [
    "catalogo",
    "prodotto",
    "prezzo",
    "recensioni",
    "correlati",
    "descrizione",
    "immagine",
    "trattativa",
    "obiezione",
    "missione_completata"
  ].includes(intent);
}

/* ============================================================
   RUN — logica principale NPC
============================================================ */
async function run(message, context = {}) {
  const intentObj = context.intent || {};
  const intent = intentObj.intent || "generico";
  const productId = intentObj.productId || null;
  const catalogo = context.catalogo || [];

  log("VENDOR_RUN", {
    uid: context.uid,
    intent,
    productId,
    catalogCount: catalogo.length
  });

  /* ============================================================
     1) CATALOGO (missione: open_catalog)
  ============================================================= */
  if (intent === "catalogo") {
    const cards = catalogo.slice(0, 20).map(p => Premium.Cards.productCard(p));

    return {
      avatar: "vendor",
      type: "list",
      title: "📚 Catalogo prodotti",
      items: cards,
      actions: [
        { label: "Torna al menu", intent: "menu" }
      ]
    };
  }

  /* ============================================================
     2) PRODOTTO PRINCIPALE (missione: view_product)
  ============================================================= */
  if (["prodotto", "prezzo", "trattativa", "obiezione"].includes(intent)) {
    if (!productId) {
      return {
        avatar: "vendor",
        type: "mission",
        blocks: [
          {
            title: "📦 Quale prodotto vuoi vedere?",
            text: "Scegli un prodotto dal catalogo."
          }
        ]
      };
    }

    const p = catalogo.find(x => x.id === productId);
    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Non trovo questo prodotto."
      };
    }

    const price = (p.prezzo_cent / 100).toFixed(2).replace(".", ",");

    return {
      avatar: "vendor",
      type: "product_card",
      product: {
        id: p.id,
        title: p.titolo_breve,
        description: p.descrizione_breve,
        price_cent: p.prezzo_cent,
        image: p.immagine_url
      },
      quick_replies: Premium.Quick.productQuickReplies(p),
      blocks: [
        {
          title: "🎯 Missione",
          text: "Hai visualizzato un prodotto!"
        }
      ]
    };
  }

  /* ============================================================
     3) RECENSIONI (missione: view_reviews)
  ============================================================= */
  if (intent === "recensioni") {
    const p = catalogo.find(x => x.id === productId);

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
      type: "list",
      title: `⭐ Recensioni: ${p.titolo_breve}`,
      items: [card],
      actions: [
        { label: "Prodotti correlati", intent: "correlati" }
      ]
    };
  }

  /* ============================================================
     4) CORRELATI (missione: view_related)
  ============================================================= */
  if (intent === "correlati") {
    const p = catalogo.find(x => x.id === productId);

    if (!p) {
      return {
        avatar: "vendor",
        type: "text",
        text: "Dimmi prima un prodotto, poi ti mostro quelli correlati."
      };
    }

    const cards = Premium.Cross.crossSellByCategory(p, catalogo);

    return {
      avatar: "vendor",
      type: "list",
      title: `🔗 Correlati a ${p.titolo_breve}`,
      items: cards,
      actions: [
        { label: "Torna al prodotto", intent: "prodotto" }
      ]
    };
  }

  /* ============================================================
     5) IMMAGINE (missione: view_product_image)
  ============================================================= */
  if (intent === "immagine") {
    const p = catalogo.find(x => x.id === productId);

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
     6) MISSIONE COMPLETATA → PROMOZIONE
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
          intent: "correlati"
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
