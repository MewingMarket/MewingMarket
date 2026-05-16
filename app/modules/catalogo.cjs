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

  // Categoria: JSON → array
  let categoria = [];
  try {
    if (typeof p.categoria === "string") {
      categoria = JSON.parse(p.categoria);
    } else if (Array.isArray(p.categoria)) {
      categoria = p.categoria;
    }
  } catch {
    categoria = [];
  }

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
    file_consegna_url: p.file_consegna_url || "",
    config_json: p.config_json || null,
    catalog_video_block: p.catalog_video_block || "",

    // Promo 2027
    promo_attiva: Boolean(p.promo_attiva),
    prezzo_scontato_cent: Number(p.prezzo_scontato_cent) || null,
    promo_badge: p.promo_badge || null,
    promo_scadenza: p.promo_scadenza || null
  };
}

/* ============================================================
   CACHE INTERNA (auto-refresh)
============================================================ */
let CACHE = [];
let LAST_FETCH = 0;

async function refreshCache() {
  const rows = await sql.getAllProducts();
  CACHE = rows.map(normalizeProduct);
  LAST_FETCH = Date.now();
}

async function getCatalog() {
  const now = Date.now();

  if (now - LAST_FETCH > 30000 || CACHE.length === 0) {
    await refreshCache();
  }

  return CACHE;
}

/* ============================================================
   RICERCA PER ID
============================================================ */
async function findProductById(id) {
  const p = await sql.getProductById(Number(id));
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
   UI JSON PER I BOT (2027)
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
      image: product.immagine_url,
      promo_attiva: product.promo_attiva,
      prezzo_scontato_cent: product.prezzo_scontato_cent,
      promo_badge: product.promo_badge
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
      youtube_url: product.youtube_url,
      promo_attiva: product.promo_attiva,
      prezzo_scontato_cent: product.prezzo_scontato_cent,
      promo_badge: product.promo_badge
    }
  };
}

function productImageJSON(product) {
  if (!product) return null;

  return {
    type: "image_card",
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
