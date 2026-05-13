/**
 * modules/catalogo.cjs — VERSIONE DEFINITIVA PATCHATA
 * Catalogo dinamico basato su backend SQL /api/prodotti/list
 * Compatibile con bot, store, PayPal e prodotto/:id
 */

const path = require("path");
const { normalize, cleanSearchQuery } = require(path.join(process.cwd(), "app/modules/utils.cjs"));
const fetch = require("node-fetch");

// Endpoint backend SQL
const CATALOG_ENDPOINT = "http://localhost:3000/api/prodotti/list";

/* ============================================================
   FETCH SICURO DAL BACKEND SQL
============================================================ */
async function fetchCatalog() {
  try {
    const res = await fetch(CATALOG_ENDPOINT);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products)) {
      console.error("catalogo: risposta backend non valida");
      return [];
    }

    // Normalizzazione snake_case → oggetto coerente
    return data.products.map(p => ({
      id: Number(p.id),
      titolo: p.titolo || "",
      titolo_breve: p.titolo_breve || p.titolo || "",
      descrizione_breve: p.descrizione_breve || "",
      descrizione_lunga: p.descrizione_lunga || "",
      prezzo_cent: Number(p.prezzo_cent) || 0,
      immagine_url: p.immagine_url || "",
      categoria: Array.isArray(p.categoria) ? p.categoria : [],
      youtube_url: p.youtube_url || "",
      youtube_description: p.youtube_description || "",
      catalog_video_block: p.catalog_video_block || ""
    }));
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
   FUNZIONI DI RICERCA — VERSIONE SQL + ID
============================================================ */
async function findProductById(id) {
  const PRODUCTS = await getCatalog();
  return PRODUCTS.find(p => Number(p.id) === Number(id)) || null;
}

async function findProductFromText(text) {
  if (!text) return null;

  const PRODUCTS = await getCatalog();
  const t = normalize(text);
  const query = cleanSearchQuery(text);

  // Match diretto
  let match = PRODUCTS.find(p =>
    normalize(p.titolo).includes(t) ||
    normalize(p.titolo_breve).includes(t)
  );
  if (match) return match;

  // Match fuzzy per keyword
  const keys = query.split(" ").filter(w => w && w.length > 2);

  for (const p of PRODUCTS) {
    const full = normalize(`${p.titolo} ${p.titolo_breve} ${p.descrizione_breve}`);
    if (keys.some(k => full.includes(k))) return p;
  }

  return null;
}

async function listProductsByCategory(cat) {
  const PRODUCTS = await getCatalog();
  return PRODUCTS.filter(p => p.categoria.includes(cat));
}

async function listAllProducts() {
  return await getCatalog();
}

/* ============================================================
   MATCH FUZZY FALLBACK (solo CACHE)
============================================================ */
function fuzzyMatchProduct(text = "") {
  if (!text) return null;
  const t = normalize(text);
  const query = cleanSearchQuery(text);
  const keys = query.split(" ").filter(w => w && w.length > 2);

  const PRODUCTS = CACHE || [];
  if (!PRODUCTS.length) return null;

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
   RISPOSTE PRODOTTO — LEGACY HTML (SERVER)
============================================================ */
function productReply(p) {
  if (!p) return "Non ho trovato questo prodotto.";

  const prezzo = (p.prezzo_cent / 100).toFixed(2);

  return `
📘 <b>${p.titolo_breve}</b>

${p.descrizione_breve}

💰 <b>Prezzo:</b> ${prezzo}€
👉 <a href="https://www.mewingmarket.it/prodotto/${p.id}" class="mm-btn">Vedi prodotto</a>

${p.youtube_url ? `🎥 Video: ${p.youtube_url}` : ""}
`;
}

function productLongReply(p) {
  if (!p) return "Non ho trovato questo prodotto.";

  const prezzo = (p.prezzo_cent / 100).toFixed(2);

  return `
📘 <b>${p.titolo}</b> — <b>Dettagli completi</b>

${p.descrizione_lunga}

💰 <b>Prezzo:</b> ${prezzo}€
👉 <a href="https://www.mewingmarket.it/prodotto/${p.id}" class="mm-btn">Vai al prodotto</a>

${p.youtube_url ? `🎥 Video: ${p.youtube_url}` : ""}
${p.youtube_description ? `📝 ${p.youtube_description}` : ""}
`;
}

function productImageReply(p) {
  if (!p) return "Non ho trovato questo prodotto.";

  return `
🖼 <b>${p.titolo_breve}</b>

<img src="${p.immagine_url}" alt="${p.titolo_breve}" />

👉 <a href="https://www.mewingmarket.it/prodotto/${p.id}" class="mm-btn">Vedi prodotto</a>
`;
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
  fuzzyMatchProduct,
  productReply,
  productLongReply,
  productImageReply
};
