/**
 * modules/catalogo.cjs — VERSIONE 2027 (PATCH COMPLETA)
 * Wrapper intelligente sopra catalogo-sql.cjs
 * Compatibile con bot, Game Engine, Intent Engine e pipeline SQL
 */

const path = require("path");
const { normalize, cleanSearchQuery } = require(path.join(process.cwd(), "app/modules/utils.cjs"));

/* ============================================================
   IMPORT CATALOGO SQL REALE
============================================================ */
const sql = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));

/* ============================================================
   NORMALIZZAZIONE PRODOTTO
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
    youtube_description: p.youtube_description || "",
    file_consegna_url: p.file_consegna_url || "",
    config_json: p.config_json || null,
    catalog_video_block: p.catalog_video_block || ""
  };
}

/* ============================================================
   CACHE INTERNA (auto-refresh)
============================================================ */
let CACHE = [];
let LAST_FETCH = 0;

function refreshCache() {
  CACHE = sql.getAllProducts().map(normalizeProduct);
  LAST_FETCH = Date.now();
}

async function getCatalog() {
  const now = Date.now();

  if (now - LAST_FETCH > 30000 || CACHE.length === 0) {
    refreshCache();
  }

  return CACHE;
}

/* ============================================================
   RICERCA PER ID
============================================================ */
async function findProductById(id) {
  const p = sql.getProductById(Number(id));
  return normalizeProduct(p);
}

/* ============================================================
   RICERCA DA TESTO (SQL + fuzzy)
============================================================ */
async function findProductFromText(text) {
  if (!text) return null;

  const PRODUCTS = await getCatalog();
  const t = normalize(text);
  const query = cleanSearchQuery(text);
  const keys = query.split(" ").filter(w => w.length > 2);

  // Match diretto
  let match = PRODUCTS.find(p =>
    normalize(p.titolo).includes(t) ||
    normalize(p.titolo_breve).includes(t)
  );
  if (match) return match;

  // Match fuzzy
  for (const p of PRODUCTS) {
    const full = normalize(`${p.titolo} ${p.titolo_breve} ${p.descrizione_breve}`);
    if (keys.some(k => full.includes(k))) return p;
  }

  return null;
}

/* ============================================================
   LISTE
============================================================ */
async function listProductsByCategory(cat) {
  const PRODUCTS = await getCatalog();
  return PRODUCTS.filter(p => p.categoria.includes(cat));
}

async function listAllProducts() {
  return await getCatalog();
}

/* ============================================================
   UI JSON PER I BOT
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
  getCatalog,
  findProductById,
  findProductFromText,
  listProductsByCategory,
  listAllProducts,

  productCardJSON,
  productDetailsJSON,
  productImageJSON
};
