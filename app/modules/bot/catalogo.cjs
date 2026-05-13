/**
 * modules/bot/catalogo.cjs — VERSIONE 2027
 * Catalogo dinamico — SQL + ID-based + ricerca fuzzy
 * Compatibile con Router AI + Bot JSON
 */

const Fuse = require("fuse.js");

/* ============================================================
   CONFIGURAZIONE FUSE (ricerca fuzzy)
============================================================ */
const fuseOptions = {
  includeScore: true,
  threshold: 0.38,
  keys: [
    "titolo",
    "titolo_breve",
    "descrizione_breve",
    "categoria"
  ]
};

/* ============================================================
   NORMALIZZA PRODOTTO SQL
============================================================ */
function normalizeProduct(p) {
  if (!p) return null;

  return {
    id: Number(p.id),
    titolo: p.titolo || "",
    titolo_breve: p.titolo_breve || p.titolo || "",
    descrizione_breve: p.descrizione_breve || "",
    descrizione_lunga: p.descrizione_lunga || "",
    prezzo_cent: Number(p.prezzo_cent) || 0,
    immagine_url: p.immagine_url || "",
    categoria: Array.isArray(p.categoria)
      ? p.categoria
      : typeof p.categoria === "string"
      ? p.categoria.split(",").map(c => c.trim())
      : [],
    youtube_url: p.youtube_url || "",
    catalog_video_block: p.catalog_video_block || ""
  };
}

/* ============================================================
   TROVA PRODOTTO PER ID
============================================================ */
function findProductById(id, products = []) {
  id = Number(id);
  const p = products.find(pr => Number(pr.id) === id);
  return normalizeProduct(p);
}

/* ============================================================
   RICERCA FUZZY DA TESTO
============================================================ */
function findProductFromText(text, products = []) {
  if (!text || !products.length) return null;

  const normalized = products.map(normalizeProduct);
  const fuse = new Fuse(normalized, fuseOptions);
  const results = fuse.search(text);

  if (!results.length) return null;

  return results[0].item;
}

/* ============================================================
   RISPOSTE JSON PER I BOT (NO HTML)
============================================================ */
function productCardJSON(product) {
  if (!product) return null;

  return {
    type: "product_card",
    product: {
      id: product.id,
      title: product.titolo,
      description: product.descrizione_breve,
      price_cent: product.prezzo_cent,
      image: product.immagine_url
    }
  };
}

function productDetailsJSON(product) {
  if (!product) return null;

  return {
    type: "product_details",
    product: {
      id: product.id,
      title: product.titolo,
      description: product.descrizione_lunga,
      price_cent: product.prezzo_cent,
      image: product.immagine_url,
      youtube_url: product.youtube_url
    }
  };
}

function productImageJSON(product) {
  if (!product) return null;

  return {
    type: "image",
    url: product.immagine_url,
    alt: product.titolo_breve
  };
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  normalizeProduct,
  findProductById,
  findProductFromText,
  productCardJSON,
  productDetailsJSON,
  productImageJSON
};
