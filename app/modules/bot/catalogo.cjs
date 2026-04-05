/**
 * modules/bot/catalogo.cjs
 * Catalogo dinamico — versione aggiornata SQL + ID-based + descrizione PRO
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
   FUNZIONE: normalizza prodotto SQL
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
    categoria: Array.isArray(p.categoria) ? p.categoria : [],
    youtube_url: p.youtube_url || "",
    catalog_video_block: p.catalog_video_block || ""
  };
}

/* ============================================================
   FUNZIONE: trova prodotto per ID
============================================================ */
function findProductById(id, products = []) {
  id = Number(id);
  const p = products.find(pr => Number(pr.id) === id);
  return normalizeProduct(p);
}

/* ============================================================
   FUNZIONE: ricerca fuzzy da testo
============================================================ */
function findProductFromText(text, products = []) {
  if (!text || !products.length) return null;

  const fuse = new Fuse(products.map(normalizeProduct), fuseOptions);
  const results = fuse.search(text);

  if (!results.length) return null;

  return results[0].item;
}

/* ============================================================
   RISPOSTA BREVE PRODOTTO (PRO breve)
============================================================ */
function productReply(product) {
  if (!product) return "Prodotto non trovato.";

  const prezzo = (product.prezzo_cent / 100).toFixed(2);

  return `
<div class="mm-card">
  <div class="mm-card-title">${product.titolo_breve}</div>
  <div class="mm-card-body">
    ${product.descrizione_breve}
    <br><br>
    <b>${prezzo}€</b><br>
    <a href="https://www.mewingmarket.it/prodotto/${product.id}" class="mm-btn">Apri</a>
  </div>
</div>
`;
}

/* ============================================================
   RISPOSTA LUNGA PRODOTTO (PRO lunga)
============================================================ */
function productLongReply(product) {
  if (!product) return "Prodotto non trovato.";

  const prezzo = (product.prezzo_cent / 100).toFixed(2);

  return `
<div class="mm-card">
  <div class="mm-card-title">${product.titolo}</div>
  <div class="mm-card-body">
    ${product.descrizione_lunga}
    <br><br>
    <b>${prezzo}€</b><br>
    <a href="https://www.mewingmarket.it/prodotto/${product.id}" class="mm-btn">Apri</a>
  </div>
</div>
`;
}

/* ============================================================
   RISPOSTA IMMAGINE PRODOTTO
============================================================ */
function productImageReply(product) {
  if (!product) return "";

  return `
<div class="mm-card">
  <img src="${product.immagine_url}" alt="${product.titolo_breve}" class="mm-img">
</div>
`;
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  normalizeProduct,
  findProductById,
  findProductFromText,
  productReply,
  productLongReply,
  productImageReply
};
