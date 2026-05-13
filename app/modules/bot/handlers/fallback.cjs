/**
 * modules/bot/handlers/fallback.cjs — VERSIONE 2027
 * Fallback Helper — usato dal bot Avatar Generico
 * Nessun HTML, nessun GPT, solo JSON UI
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
   FALLBACK GENERICO
============================================================ */
function fallbackGeneric() {
  return {
    type: "quick_replies",
    avatar: "assistant",
    text: "Non ho capito bene. Posso aiutarti con catalogo, supporto, social o newsletter.",
    options: [
      { label: "Catalogo", value: "catalogo" },
      { label: "Supporto", value: "supporto" },
      { label: "Social", value: "social" },
      { label: "Newsletter", value: "newsletter" },
      { label: "Menu", value: "menu" }
    ]
  };
}

/* ============================================================
   EXPORT — usato da Avatar Generico
============================================================ */
module.exports = {
  fallbackFAQ,
  fallbackGuide,
  fallbackProduct,
  fallbackGeneric
};
