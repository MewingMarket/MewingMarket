/**
 * modules/bot/catalogo.cjs — VERSIONE 2027 (PATCH COMPLETA)
 * Catalogo dinamico — SQL + ID-based + ricerca fuzzy
 * Compatibile con Router AI + Bot JSON + Game Engine
 */

const path = require("path");
const Fuse = require("fuse.js");

/* ============================================================
   IMPORT CORRETTO — catalogo SQL reale
============================================================ */
const {
  getCatalog,
  findProductById: findByIdSQL,
  findProductFromText: findByTextSQL
} = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));

/* ============================================================
   CONFIGURAZIONE FUSE (ricerca fuzzy locale)
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

  const categoriaRaw = p.categoria;

  const categoria = Array.isArray(categoriaRaw)
    ? categoriaRaw
    : typeof categoriaRaw === "string"
    ? categoriaRaw
        .split(",")
        .map(c => c.trim())
        .filter(Boolean)
    : [];

  return {
    id: Number(p.id),
    titolo: p.titolo || "",
    titolo_breve: p.titolo_breve || p.titolo || "",
    descrizione_breve: p.descrizione_breve || "",
    descrizione_lunga: p.descrizione_lunga || "",
    prezzo_cent: Number(p.prezzo_cent) || 0,
    immagine_url: p.immagine_url || "",
    categoria,
    youtube_url: p.youtube_url || "",
    youtube_description: p.youtube_description || "",
    catalog_video_block: p.catalog_video_block || ""
  };
}

/* ============================================================
   TROVA PRODOTTO PER ID (SQL)
============================================================ */
async function findProductById(id) {
  const p = await findByIdSQL(id);
  return normalizeProduct(p);
}

/* ============================================================
   RICERCA FUZZY DA TESTO (SQL + fallback Fuse)
============================================================ */
async function findProductFromText(text) {
  if (!text || typeof text !== "string") return null;

  // 1) SQL search
  const sqlMatch = await findByTextSQL(text);
  if (sqlMatch) return normalizeProduct(sqlMatch);

  // 2) Fallback fuzzy locale
  const catalog = await getCatalog();
  if (!Array.isArray(catalog) || !catalog.length) return null;

  const normalized = catalog
    .map(normalizeProduct)
    .filter(Boolean);

  if (!normalized.length) return null;

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
