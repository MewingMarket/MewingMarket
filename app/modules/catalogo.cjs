// modules/catalogo.cjs — VERSIONE MAX (UX PREMIUM)

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
// RISPOSTE PRODOTTO — VERSIONE MAX
// ---------------------------------------------

function productReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  let out = `
📘 <b>${p.titolo}</b>

${p.descrizioneBreve}

💰 <b>Prezzo:</b> ${p.prezzo}
👉 <b>Acquista ora</b>  
${p.linkPayhip}
`;

  if (p.youtube_url) {
    out += `
🎥 <b>Video di presentazione</b>  
${p.youtube_url}
`;
  }

  if (p.catalog_video_block) {
    out += `

🎬 <b>Anteprima</b>  
${p.catalog_video_block}
`;
  }

  if (p.slug === MAIN_PRODUCT_SLUG) {
    out += `

✨ Vuoi vedere il video di presentazione completo?  
Scrivi: <b>"video"</b> oppure <b>"video ecosistema"</b>.
`;
  }

  out += `

Se vuoi un altro prodotto, scrivi il nome o "catalogo".`;

  return out;
}

function productLongReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  let out = `
📘 <b>${p.titolo}</b> — <b>Dettagli completi</b>

${p.descrizioneLunga}

💰 <b>Prezzo:</b> ${p.prezzo}
👉 <b>Acquista ora</b>  
${p.linkPayhip}
`;

  if (p.youtube_url) {
    out += `

🎥 <b>Video</b>  
${p.youtube_url}
`;
  }

  if (p.youtube_description) {
    out += `

📝 <b>Descrizione video</b>  
${p.youtube_description}
`;
  }

  out += `

Vuoi acquistarlo o tornare al menu?`;

  return out;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  return `
🖼 <b>Copertina di ${p.titoloBreve}</b>

${p.immagine}

👉 <b>Acquista qui:</b>  
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
