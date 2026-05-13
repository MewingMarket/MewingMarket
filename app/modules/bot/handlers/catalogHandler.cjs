/**
 * modules/bot/handlers/catalogHandler.cjs — VERSIONE 2027
 * Catalog Helper — usato dal bot Vendor AI
 * Nessun HTML, solo JSON UI
 */

const path = require("path");
const { normalizeProduct } = require(path.join(process.cwd(), "app/modules/bot/catalogo.cjs"));
const { log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));

/* ============================================================
   CATALOGO COMPLETO (JSON UI)
============================================================ */
function catalogList(products = []) {
  log("CATALOG_LIST", { count: products.length });

  if (!products.length) {
    return {
      type: "text",
      avatar: "sales_ai",
      text: "Il catalogo è temporaneamente non disponibile."
    };
  }

  return {
    type: "list",
    avatar: "sales_ai",
    title: "Catalogo MewingMarket",
    items: products.map(p => ({
      label: p.titolo_breve,
      value: `prodotto_${p.id}`,
      price_cent: p.prezzo_cent,
      image: p.immagine_url
    })),
    actions: [
      { label: "Torna al menu", value: "menu" }
    ]
  };
}

/* ============================================================
   CATALOGO RIDOTTO (per suggerimenti)
============================================================ */
function catalogSuggestions(products = []) {
  const top = products.slice(0, 3).map(normalizeProduct);

  return {
    type: "carousel",
    avatar: "sales_ai",
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
   EXPORT — usato da Vendor AI
============================================================ */
module.exports = {
  catalogList,
  catalogSuggestions
};
