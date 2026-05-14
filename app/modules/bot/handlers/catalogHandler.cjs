/**
 * modules/bot/handlers/catalogHandler.cjs — VERSIONE VIDEOGIOCO 2027 (PATCH COMPLETA)
 * Catalog Helper — usato da Vendor AI + Influencer AI + Professor AI
 * Nessun HTML, solo JSON UI per il Game Engine
 */

const path = require("path");
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));

/* Normalizzazione prodotto */
function N(p) {
  return catalogo.normalizeProduct ? catalogo.normalizeProduct(p) : p;
}

/* ============================================================
   1) LISTA COMPLETA CATALOGO (UI stile WhatsApp)
============================================================ */
function catalogList(products = []) {
  log("CATALOG_LIST", { count: products.length });

  const list = products.map(N);

  if (!list.length) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Il catalogo è temporaneamente non disponibile."
    };
  }

  // ⭐ PATCH PROMO — aggiunta badge + prezzo scontato
  const listPromo = list.map(p => {
    const base = {
      id: p.id,
      label: p.titolo_breve,
      price_cent: p.prezzo_cent,
      image: p.immagine_url
    };

    if (p.promo_attiva) {
      base.promo = {
        attiva: true,
        prezzo_scontato_cent: p.prezzo_scontato_cent,
        badge: p.promo_badge || "Promo"
      };

      if (p.promo_scadenza) {
        base.promo_scadenza = p.promo_scadenza;
      }
    }

    return base;
  });

  return {
    type: "list",
    avatar: "vendor",
    title: "Catalogo MewingMarket",
    items: listPromo,
    actions: [
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ============================================================
   2) SUGGERIMENTI (carousel) — Vendor + Influencer
============================================================ */
function catalogSuggestions(products = []) {
  const list = products.map(N).slice(0, 3);

  if (!list.length) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Non ho suggerimenti al momento."
    };
  }

  return {
    type: "carousel",
    avatar: "vendor",
    title: "Prodotti consigliati",
    items: list.map(p => {
      const item = {
        id: p.id,
        title: p.titolo_breve,
        description: p.descrizione_breve,
        price_cent: p.prezzo_cent,
        image: p.immagine_url
      };

      // ⭐ PATCH PROMO
      if (p.promo_attiva) {
        item.promo = {
          attiva: true,
          prezzo_scontato_cent: p.prezzo_scontato_cent,
          badge: p.promo_badge || "Promo"
        };

        if (p.promo_scadenza) {
          item.promo_scadenza = p.promo_scadenza;
        }
      }

      return item;
    })
  };
}

/* ============================================================
   3) SUGGERIMENTI PER INFLUENCER (sidekick)
============================================================ */
function influencerSuggestions(products = []) {
  const list = products.map(N).slice(0, 2);

  if (!list.length) {
    return {
      type: "text",
      avatar: "influencer",
      text: "Non ho hype da aggiungere ora 😅"
    };
  }

  return {
    type: "carousel",
    avatar: "influencer",
    title: "Hai visto questi? 🔥",
    items: list.map(p => {
      const item = {
        id: p.id,
        title: p.titolo_breve,
        description: p.descrizione_breve,
        image: p.immagine_url
      };

      // ⭐ PATCH PROMO
      if (p.promo_attiva) {
        item.promo = {
          attiva: true,
          prezzo_scontato_cent: p.prezzo_scontato_cent,
          badge: p.promo_badge || "Promo"
        };

        if (p.promo_scadenza) {
          item.promo_scadenza = p.promo_scadenza;
        }
      }

      return item;
    })
  };
}

/* ============================================================
   4) CARD PER TUTORIAL (Professor)
============================================================ */
function tutorialCard(product) {
  const p = N(product);
  if (!p) return null;

  return {
    type: "tutorial_card",
    avatar: "professor",
    title: `Come usare ${p.titolo_breve}`,
    steps: [
      "Apri il prodotto",
      "Segui le istruzioni",
      "Guarda il video tutorial"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: p.youtube_url
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
