// modules/catalogo.cjs — VERSIONE MAX (UX PREMIUM)

const path = require("path");

// IMPORT CORRETTI (blindati)
const { normalize } = require(path.join(__dirname, "utils.cjs"));
const { getProducts } = require(path.join(__dirname, "airtable.cjs"));

// Costante prodotto principale
const MAIN_PRODUCT_SLUG = "guida-ecosistema-digitale-reale";

/* =========================================================
   FUNZIONI DI SICUREZZA
========================================================= */
function safeProducts() {
  try {
    const p = getProducts();
    return Array.isArray(p) ? p : [];
  } catch (err) {
    console.error("catalogo: errore getProducts:", err);
    return [];
  }
}

function safeString(v) {
  return typeof v === "string" ? v : "";
}

/* =========================================================
   FUNZIONI DI RICERCA
========================================================= */
function findProductBySlug(slug) {
  if (!slug) return null;
  const PRODUCTS = safeProducts();
  return PRODUCTS.find(p => p.slug === slug) || null;
}

function findProductFromText(text) {
  if (!text) return null;

  const PRODUCTS = safeProducts();
  const t = normalize(text);

  return (
    PRODUCTS.find(p =>
      normalize(safeString(p.titolo)).includes(t) ||
      normalize(safeString(p.titoloBreve)).includes(t) ||
      normalize(safeString(p.slug)).includes(t) ||
      normalize(safeString(p.id)).includes(t)
    ) || null
  );
}

function listProductsByCategory(cat) {
  if (!cat) return [];
  const PRODUCTS = safeProducts();
  return PRODUCTS.filter(p => p.categoria === cat);
}

function listAllProducts() {
  return safeProducts();
}

/* =========================================================
   RISPOSTE PRODOTTO — VERSIONE MAX (blindata)
========================================================= */
function productReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  const titolo = safeString(p.titolo);
  const breve = safeString(p.descrizioneBreve);
  const prezzo = p.prezzo ?? "";
  const link = safeString(p.linkPayhip);

  let out = `
📘 <b>${titolo}</b>

${breve}

💰 <b>Prezzo:</b> ${prezzo}
👉 <b>Acquista ora</b>  
${link}
`;

  if (p.youtube_url) {
    out += `
🎥 <b>Video di presentazione</b>  
${safeString(p.youtube_url)}
`;
  }

  if (p.catalog_video_block) {
    out += `

🎬 <b>Anteprima</b>  
${safeString(p.catalog_video_block)}
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

  const titolo = safeString(p.titolo);
  const lunga = safeString(p.descrizioneLunga);
  const prezzo = p.prezzo ?? "";
  const link = safeString(p.linkPayhip);

  let out = `
📘 <b>${titolo}</b> — <b>Dettagli completi</b>

${lunga}

💰 <b>Prezzo:</b> ${prezzo}
👉 <b>Acquista ora</b>  
${link}
`;

  if (p.youtube_url) {
    out += `

🎥 <b>Video</b>  
${safeString(p.youtube_url)}
`;
  }

  if (p.youtube_description) {
    out += `

📝 <b>Descrizione video</b>  
${safeString(p.youtube_description)}
`;
  }

  out += `

Vuoi acquistarlo o tornare al menu?`;

  return out;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto nel catalogo.";

  return `
🖼 <b>Copertina di ${safeString(p.titoloBreve)}</b>

${safeString(p.immagine)}

👉 <b>Acquista qui:</b>  
${safeString(p.linkPayhip)}

Vuoi altre info su questo prodotto o tornare al menu?
`;
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  MAIN_PRODUCT_SLUG,
  findProductBySlug,
  findProductFromText,
  listProductsByCategory,
  listAllProducts,
  productReply,
  productLongReply,
  productImageReply
};
