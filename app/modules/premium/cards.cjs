/**
 * premium/cards.cjs — VERSIONE VIDEOGIOCO 2027
 * Modulo JSON UI per card prodotto, catalogo, video, prezzo e confronto.
 * Compatibile con Game Engine WhatsApp-style.
 */

function productCard(product) {
  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Non ho trovato questo prodotto."
    };
  }

  return {
    type: "product_card",
    avatar: "vendor",
    product: {
      id: product.id,
      title: product.titolo_breve || product.titolo,
      description: product.descrizione_breve,
      price_cent: product.prezzo_cent,
      image: product.immagine_url
    },
    actions: [
      { label: "Dettagli", intent: "dettagli_prodotto", productId: product.id },
      { label: "Recensioni", intent: "recensioni", productId: product.id },
      { label: "Correlati", intent: "prodotti_correlati", productId: product.id }
    ]
  };
}

/* ------------------------------------------
   CATALOGO (LISTA)
------------------------------------------ */
function catalogCard(products = []) {
  if (!products.length) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Il catalogo è vuoto."
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
      image: p.immagine_url,
      intent: "prodotto",
      productId: p.id
    })),
    actions: [
      { label: "Torna al menu", intent: "menu" }
    ]
  };
}

/* ------------------------------------------
   VIDEO CARD (TV)
------------------------------------------ */
function videoCard(url, title = "Video") {
  if (!url) {
    return {
      type: "text",
      avatar: "influencer",
      text: "Nessun video disponibile."
    };
  }

  return {
    type: "tutorial_card",
    avatar: "influencer",
    title,
    steps: [
      "Guarda il video sulla TV",
      "Segui i passaggi",
      "Applica ciò che impari"
    ],
    actions: [
      {
        label: "Guarda il video",
        type: "open_video",
        video_url: url
      }
    ]
  };
}

/* ------------------------------------------
   CARD PREZZO
------------------------------------------ */
function priceCard(product) {
  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Non trovo il prezzo di questo prodotto."
    };
  }

  return {
    type: "card",
    avatar: "vendor",
    layout: "price",
    title: `💰 Prezzo: ${(product.prezzo_cent / 100).toFixed(2)}€`,
    text: `${product.titolo_breve} è un prodotto digitale immediatamente scaricabile.`,
    actions: [
      { label: "Apri prodotto", intent: "prodotto", productId: product.id }
    ]
  };
}

/* ------------------------------------------
   CARD CONFRONTO
------------------------------------------ */
function compareCard(a, b) {
  if (!a || !b) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Non ho abbastanza informazioni per confrontare i prodotti."
    };
  }

  return {
    type: "compare",
    avatar: "vendor",
    title: "🔍 Confronto prodotti",
    products: [
      {
        id: a.id,
        title: a.titolo_breve,
        price_cent: a.prezzo_cent,
        image: a.immagine_url
      },
      {
        id: b.id,
        title: b.titolo_breve,
        price_cent: b.prezzo_cent,
        image: b.immagine_url
      }
    ],
    actions: [
      { label: "Apri A", intent: "prodotto", productId: a.id },
      { label: "Apri B", intent: "prodotto", productId: b.id }
    ]
  };
}

/* ------------------------------------------
   EXPORT JSON UI
------------------------------------------ */
module.exports = {
  productCard,
  catalogCard,
  videoCard,
  priceCard,
  compareCard
};
