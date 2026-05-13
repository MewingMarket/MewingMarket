/**
 * premium/crossSell.cjs — VERSIONE VIDEOGIOCO 2027
 * Modulo JSON UI per suggerimenti intelligenti (cross-sell).
 * Compatibile con Game Engine WhatsApp-style.
 */

/* ============================================================
   CROSS-SELL GENERICO
============================================================ */
function crossSellGeneric(product) {
  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Posso consigliarti prodotti correlati se vuoi."
    };
  }

  return {
    type: "card",
    avatar: "vendor",
    layout: "info",
    title: "💡 Ti potrebbe interessare anche",
    text: "Vuoi migliorare ancora di più i tuoi risultati? Posso mostrarti prodotti correlati.",
    actions: [
      { label: "Mostra correlati", intent: "prodotti_correlati", productId: product.id }
    ]
  };
}

/* ============================================================
   CROSS-SELL PER CATEGORIA
============================================================ */
function crossSellByCategory(product, allProducts = []) {
  if (!product || !Array.isArray(allProducts)) {
    return crossSellGeneric(product);
  }

  const categoria = product.categoria;
  if (!categoria) return crossSellGeneric(product);

  const correlati = allProducts
    .filter(p => p.id !== product.id && p.categoria === categoria)
    .slice(0, 3);

  if (!correlati.length) return crossSellGeneric(product);

  return {
    type: "carousel",
    avatar: "vendor",
    title: `🔗 Prodotti correlati (${categoria})`,
    items: correlati.map(p => ({
      id: p.id,
      title: p.titolo_breve,
      description: p.descrizione_breve,
      price_cent: p.prezzo_cent,
      image: p.immagine_url
    })),
    actions: [
      { label: "Mostra dettagli", intent: "dettagli_prodotto", productId: product.id }
    ]
  };
}

/* ============================================================
   CROSS-SELL BASATO SU SIMILITUDINE DEL TITOLO
============================================================ */
function crossSellByProduct(product, allProducts = []) {
  if (!product) return crossSellGeneric(product);

  const titolo = (product.titolo_breve || product.titolo || "").toLowerCase();
  const keywords = titolo.split(" ").filter(k => k.length > 3);

  const correlati = allProducts.filter(p => {
    if (p.id === product.id) return false;
    const t = (p.titolo_breve || p.titolo || "").toLowerCase();
    return keywords.some(k => t.includes(k));
  }).slice(0, 3);

  if (!correlati.length) return crossSellGeneric(product);

  return {
    type: "carousel",
    avatar: "vendor",
    title: "✨ Basato su ciò che hai visto",
    items: correlati.map(p => ({
      id: p.id,
      title: p.titolo_breve,
      description: p.descrizione_breve,
      price_cent: p.prezzo_cent,
      image: p.immagine_url
    })),
    actions: [
      { label: "Mostra correlati", intent: "prodotti_correlati", productId: product.id }
    ]
  };
}

/* ============================================================
   CROSS-SELL UPGRADE (versione premium)
============================================================ */
function crossSellUpgrade(product, allProducts = []) {
  if (!product) return crossSellGeneric(product);

  const upgrade = allProducts
    .filter(
      p =>
        p.id !== product.id &&
        p.categoria === product.categoria &&
        Number(p.prezzo_cent) > Number(product.prezzo_cent)
    )
    .sort((a, b) => b.prezzo_cent - a.prezzo_cent);

  if (!upgrade.length) return null;

  const best = upgrade[0];

  return {
    type: "card",
    avatar: "vendor",
    layout: "upgrade",
    title: "⬆️ Upgrade consigliato",
    text: `Se vuoi una versione più completa rispetto a *${product.titolo_breve}*, valuta questo:`,
    product: {
      id: best.id,
      title: best.titolo_breve,
      price_cent: best.prezzo_cent,
      image: best.immagine_url
    },
    actions: [
      { label: "Apri prodotto", intent: "prodotto", productId: best.id }
    ]
  };
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  crossSellGeneric,
  crossSellByCategory,
  crossSellByProduct,
  crossSellUpgrade
};
