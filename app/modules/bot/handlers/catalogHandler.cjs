/**
 * modules/bot/handlers/catalogHandler.cjs — VERSIONE VIDEOGIOCO 2027
 * Catalog Helper — usato da Vendor AI + Influencer AI
 * Nessun HTML, solo JSON UI per il Game Engine
 */

const path = require("path");
const { normalizeProduct } = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   1) LISTA COMPLETA CATALOGO (UI stile WhatsApp)
============================================================ */
function catalogList(products = []) {
  log("CATALOG_LIST", { count: products.length });

  if (!products.length) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Il catalogo è temporaneamente non disponibile."
    };
  }

  return {
    type: "list",
    avatar: "vendor",
    title: "Catalogo MewingMarket",
    items: products.map(p => ({
      id: p.id,
      label: p.titolo_breve,
      price_cent: p.prezzo_cent,
      image: p.immagine_url
    })),
    actions: [
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   2) SUGGERIMENTI (carousel) — usato da Vendor + Influencer
============================================================ */
function catalogSuggestions(products = []) {
  const top = products.slice(0, 3).map(normalizeProduct);

  return {
    type: "carousel",
    avatar: "vendor",
    title: "Prodotti consigliati",
    items: top.map(p => ({
      id: p.id,
      title: p.titolo_breve,
      description: p.descrizione_breve,
      price_cent: p.prezzo_cent,
      image: p.immagine_url
    }))
  };
}

/* ============================================================
   3) SUGGERIMENTI PER INFLUENCER (sidekick)
============================================================ */
function influencerSuggestions(products = []) {
  const top = products.slice(0, 2).map(normalizeProduct);

  return {
    type: "carousel",
    avatar: "influencer",
    title: "Hai visto questi? 🔥",
    items: top.map(p => ({
      id: p.id,
      title: p.titolo_breve,
      description: p.descrizione_breve,
      image: p.immagine_url
    }))
  };
}

/* ============================================================
   4) CARD PER TUTORIAL (TV + video)
============================================================ */
function tutorialCard(product) {
  if (!product) return null;

  return {
    type: "tutorial_card",
    avatar: "professor",
    title: `Come usare ${product.titolo_breve}`,
    steps: [
      "Apri il prodotto",
      "Segui le istruzioni",
      "Guarda il video tutorial"
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
   EXPORT
============================================================ */
module.exports = {
  catalogList,
  catalogSuggestions,
  influencerSuggestions,
  tutorialCard
};
