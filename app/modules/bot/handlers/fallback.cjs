/**
 * modules/bot/handlers/fallback.cjs — VERSIONE VIDEOGIOCO 2027
 * Fallback Helper — Avatar Generico (Assistant)
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   FALLBACK FAQ
============================================================ */
function fallbackFAQ(faq) {
  return {
    type: "faq",
    avatar: "assistant",
    question: faq.domanda,
    answer: faq.risposta_base
  };
}

/* ============================================================
   FALLBACK GUIDE
============================================================ */
function fallbackGuide(guide) {
  return {
    type: "guide",
    avatar: "assistant",
    title: guide.titolo,
    steps: guide.steps || []
  };
}

/* ============================================================
   FALLBACK PRODOTTO
============================================================ */
function fallbackProduct(product) {
  return {
    type: "product_card",
    avatar: "assistant",
    product: {
      id: product.id,
      title: product.titolo,
      description: product.descrizione_breve,
      price_cent: product.prezzo_cent,
      image: product.immagine_url
    }
  };
}

/* ============================================================
   FALLBACK TUTORIAL TV (video)
============================================================ */
function fallbackTutorial(videoUrl) {
  return {
    type: "tutorial_card",
    avatar: "assistant",
    title: "Non ho capito bene, ma questo può aiutarti",
    steps: [
      "Guarda il video sulla TV",
      "Segui le istruzioni",
      "Torna al menu per continuare"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: videoUrl
      }
    ]
  };
}

/* ============================================================
   FALLBACK GENERICO (intent‑driven)
============================================================ */
function fallbackGeneric() {
  return {
    type: "quick_replies",
    avatar: "assistant",
    text: "Non ho capito bene. Posso aiutarti con catalogo, supporto, social o newsletter.",
    options: [
      { label: "Catalogo", intent: "catalogo" },
      { label: "Supporto", intent: "supporto" },
      { label: "Social", intent: "social" },
      { label: "Newsletter", intent: "newsletter" },
      { label: "Menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   EXPORT — Avatar Generico
============================================================ */
module.exports = {
  fallbackFAQ,
  fallbackGuide,
  fallbackProduct,
  fallbackTutorial,
  fallbackGeneric
};
