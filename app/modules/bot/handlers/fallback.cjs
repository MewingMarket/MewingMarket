/**
 * modules/bot/handlers/fallback.cjs — VERSIONE VIDEOGIOCO 2027 (PATCH COMPLETA)
 * Fallback Helper — Avatar Generico (Assistant)
 * Nessun HTML, nessun GPT, solo JSON UI compatibile con Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   FALLBACK FAQ
============================================================ */
function fallbackFAQ(faq) {
  log("FALLBACK_FAQ", { id: faq?.id });

  if (!faq) {
    return fallbackGeneric();
  }

  return {
    type: "faq",
    avatar: "assistant",
    question: faq.domanda || "Domanda non disponibile",
    answer: faq.risposta_base || "Non ho una risposta precisa, ma posso aiutarti nel menu."
  };
}

/* ============================================================
   FALLBACK GUIDE
============================================================ */
function fallbackGuide(guide) {
  log("FALLBACK_GUIDE", { id: guide?.id });

  if (!guide) {
    return fallbackGeneric();
  }

  return {
    type: "guide",
    avatar: "assistant",
    title: guide.titolo || "Guida non disponibile",
    steps: Array.isArray(guide.steps) ? guide.steps : []
  };
}

/* ============================================================
   FALLBACK PRODOTTO
============================================================ */
function fallbackProduct(product) {
  log("FALLBACK_PRODUCT", { id: product?.id });

  if (!product) {
    return fallbackGeneric();
  }

  return {
    type: "product_card",
    avatar: "assistant",
    product: {
      id: product.id,
      title: product.titolo || "Prodotto",
      description: product.descrizione_breve || "",
      price_cent: product.prezzo_cent || 0,
      image: product.immagine_url || ""
    }
  };
}

/* ============================================================
   FALLBACK TUTORIAL TV (video)
============================================================ */
function fallbackTutorial(videoUrl) {
  log("FALLBACK_TUTORIAL", { videoUrl });

  const safeUrl = typeof videoUrl === "string" ? videoUrl : null;

  return {
    type: "tutorial_card",
    avatar: "assistant",
    title: "Non ho capito bene, ma questo può aiutarti",
    steps: [
      "Guarda il video sulla TV",
      "Segui le istruzioni",
      "Torna al menu per continuare"
    ],
    actions: safeUrl
      ? [
          {
            label: "Guarda il video",
            type: "open_video",
            video_url: safeUrl
          }
        ]
      : []
  };
}

/* ============================================================
   FALLBACK GENERICO (intent‑driven)
============================================================ */
function fallbackGeneric() {
  log("FALLBACK_GENERIC");

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
