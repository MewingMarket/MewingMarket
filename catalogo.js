// modules/catalogo.js

const { normalize } = require("./utils");
const { getProducts } = require("./airtable");

// Costante prodotto principale
const MAIN_PRODUCT_SLUG = "guida-ecosistema-digitale-reale";

// ---------------------------------------------
// FUNZIONI DI RICERCA
// ---------------------------------------------

function findProductBySlug(slug) {
  const PRODUCTS = getProducts();
  return PRODUCTS.find(p => p.slug === slug);
}

function findProductFromText(text) {
  const PRODUCTS = getProducts();
  const t = normalize(text);
  return PRODUCTS.find(p =>
    normalize(p.titolo).includes(t) ||
    normalize(p.titoloBreve).includes(t) ||
    normalize(p.slug).includes(t) ||
    normalize(p.id).includes(t)
  );
}

function listProductsByCategory(cat) {
  const PRODUCTS = getProducts();
  return PRODUCTS.filter(p => p.categoria === cat);
}

// ---------------------------------------------
// RISPOSTE PRODOTTO (BOT)
// ---------------------------------------------

function productReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  let base = `
📘 *${p.titolo}*

${p.descrizioneBreve}

💰 Prezzo: ${p.prezzo}
👉 Acquista ora su Payhip  
${p.linkPayhip}
`;

  if (p.slug === MAIN_PRODUCT_SLUG) {
    base += `
🎥 Vuoi vedere il video di presentazione?  
Scrivi: "video" oppure "video ecosistema".
`;
  }

  base += `

Se vuoi un altro prodotto, scrivi il nome o "catalogo".`;

  return base;
}

function productLongReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";
  return `
📘 *${p.titolo}* — Dettagli completi

${p.descrizioneLunga}

💰 Prezzo: ${p.prezzo}
👉 Acquista ora su Payhip  
${p.linkPayhip}

Vuoi acquistarlo o tornare al menu?
`;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";
  return `
🖼 Copertina di *${p.titoloBreve}*

${p.immagine}

Puoi acquistarlo qui:  
${p.linkPayhip}

Vuoi altre info su questo prodotto o tornare al menu?
`;
}

module.exports = {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  findProductFromText,
  listProductsByCategory,
  productReply,
  productLongReply,
  productImageReply
};
