/**
 * modules/catalogo.cjs — VERSIONE DEFINITIVA
 * Catalogo dinamico basato sul backend /api/prodotti/list
 * Compatibile con bot, store, PayPal e prodotto.html
 */

const path = require("path");
const { normalize, extractKeywords } = require(path.join(__dirname, "bot", "utils.cjs"));
const fetch = require("node-fetch");

// Endpoint backend
const CATALOG_ENDPOINT = "http://localhost:3000/api/prodotti/list";

/* ============================================================
   FETCH SICURO DAL BACKEND
============================================================ */
async function fetchCatalog() {
  try {
    const res = await fetch(CATALOG_ENDPOINT);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products)) {
      console.error("catalogo: risposta backend non valida");
      return [];
    }

    return data.products;
  } catch (err) {
    console.error("catalogo: errore fetchCatalog:", err);
    return [];
  }
}

/* ============================================================
   CACHE INTERNA (auto-refresh)
============================================================ */
let CACHE = [];
let LAST_FETCH = 0;

async function getCatalog() {
  const now = Date.now();

  // Aggiorna ogni 30 secondi
  if (now - LAST_FETCH > 30000 || CACHE.length === 0) {
    CACHE = await fetchCatalog();
    LAST_FETCH = now;
  }

  return CACHE;
}

/* ============================================================
   FUNZIONI DI RICERCA
============================================================ */
async function findProductBySlug(slug) {
  if (!slug) return null;
  const PRODUCTS = await getCatalog();
  return PRODUCTS.find(p => p.slug === slug) || null;
}

async function findProductFromText(text) {
  if (!text) return null;

  const PRODUCTS = await getCatalog();
  const t = normalize(text);
  const keys = extractKeywords(text);

  // Match diretto
  let match = PRODUCTS.find(p =>
    normalize(p.titolo).includes(t) ||
    normalize(p.titoloBreve).includes(t) ||
    normalize(p.slug).includes(t)
  );
  if (match) return match;

  // Match fuzzy per keyword
  for (const p of PRODUCTS) {
    const full = normalize(`${p.titolo} ${p.titoloBreve} ${p.slug}`);
    if (keys.some(k => full.includes(k))) return p;
  }

  return null;
}

async function listProductsByCategory(cat) {
  const PRODUCTS = await getCatalog();
  return PRODUCTS.filter(p => p.categoria === cat);
}

async function listAllProducts() {
  return await getCatalog();
}

/* ============================================================
   MATCH FUZZY PER FALLBACK
============================================================ */
function fuzzyMatchProduct(text = "") {
  if (!text) return null;
  const t = normalize(text);
  const keys = extractKeywords(text);

  const PRODUCTS = CACHE || [];
  if (!PRODUCTS.length) return null;

  // Match diretto su CACHE
  let match = PRODUCTS.find(p =>
    normalize(p.titolo).includes(t) ||
    normalize(p.titoloBreve).includes(t) ||
    normalize(p.slug).includes(t)
  );
  if (match) return match;

  // Match fuzzy per keyword
  for (const p of PRODUCTS) {
    const full = normalize(`${p.titolo} ${p.titoloBreve} ${p.slug}`);
    if (keys.some(k => full.includes(k))) return p;
  }

  return null;
}

/* ============================================================
   RISPOSTE PRODOTTO — VERSIONE PREMIUM
============================================================ */
function productReply(p) {
  if (!p) return "Non ho trovato questo prodotto.";

  return `
📘 <b>${p.titolo}</b>

${p.descrizioneBreve || ""}

💰 <b>Prezzo:</b> ${p.prezzo}€
👉 <a href="prodotto.html?slug=${p.slug}" class="mm-btn">Vedi prodotto</a>

${p.youtube_url ? `🎥 Video: ${p.youtube_url}` : ""}
`;
}

function productLongReply(p) {
  if (!p) return "Non ho trovato questo prodotto.";

  return `
📘 <b>${p.titolo}</b> — <b>Dettagli completi</b>

${p.descrizioneLunga || ""}

💰 <b>Prezzo:</b> ${p.prezzo}€
👉 <a href="prodotto.html?slug=${p.slug}" class="mm-btn">Vai al prodotto</a>

${p.youtube_url ? `🎥 Video: ${p.youtube_url}` : ""}
${p.youtube_description ? `📝 ${p.youtube_description}` : ""}
`;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto.";

  return `
🖼 <b>${p.titoloBreve}</b>

${p.immagine}

👉 <a href="prodotto.html?slug=${p.slug}" class="mm-btn">Vedi prodotto</a>
`;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  getCatalog,
  findProductBySlug,
  findProductFromText,
  listProductsByCategory,
  listAllProducts,
  fuzzyMatchProduct,
  productReply,
  productLongReply,
  productImageReply
};
