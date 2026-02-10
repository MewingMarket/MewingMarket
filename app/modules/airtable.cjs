// modules/airtable.cjs — VERSIONE BLINDATA + MERGE PAYHIP

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const {
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL
} = require(path.join(__dirname, "utils.cjs"));

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE;

let PRODUCTS = [];
let PAYHIP_CACHE = {}; // fallback commerciale

const PRODUCTS_PATH = path.join(__dirname, "..", "data", "products.json");

/* =========================================================
   LETTURA SICURA DEL FILE
========================================================= */
function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/* =========================================================
   MERGE PAYHIP + AIRTABLE
========================================================= */
function mergeProduct(airtable, payhip) {
  if (!payhip) return airtable;

  return {
    ...airtable,

    // CAMPI COMMERCIALI DA PAYHIP
    prezzo: payhip.price ?? airtable.prezzo,
    titolo: payhip.title ?? airtable.titolo,
    immagine: payhip.image ?? airtable.immagine,
    linkPayhip: payhip.url ?? airtable.linkPayhip
  };
}

/* =========================================================
   SYNC AIRTABLE (editoriale)
========================================================= */
async function syncAirtable() {
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!data.records) return [];

    const products = data.records.map(record => {
      const f = record.fields;

      return {
        id: record.id,

        titolo: cleanText(f.Titolo, "Titolo mancante"),
        titoloBreve: cleanText(f.TitoloBreve, ""),
        slug: safeSlug(f.Slug),
        prezzo: cleanNumber(f.Prezzo),
        categoria: cleanText(f.Categoria, "Generico"),

        attivo: Boolean(f.Attivo),

        immagine: cleanURL(f.Immagine?.[0]?.url),
        linkPayhip: cleanURL(f.LinkPayhip),

        descrizioneBreve: cleanText(f.DescrizioneBreve, ""),
        descrizioneLunga: cleanText(f.DescrizioneLunga, ""),

        youtube_url: cleanURL(f.youtube_url),
        youtube_title: cleanText(f.youtube_title, ""),
        youtube_description: cleanText(f.youtube_description, ""),
        youtube_thumbnail: cleanURL(f.youtube_thumbnail),
        catalog_video_block: cleanText(f.catalog_video_block, ""),

        meta_description: cleanText(f.meta_description, ""),
        social_caption_full: cleanText(f.social_caption_full, "")
      };
    });

    const active = products.filter(p => p.attivo);

    // MERGE PAYHIP + AIRTABLE
    const merged = active.map(p => mergeProduct(p, PAYHIP_CACHE[p.slug]));

    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(merged, null, 2));

    console.log(`products.json aggiornato da Airtable (${merged.length} prodotti)`);

    return merged;

  } catch (err) {
    console.error("Errore sync Airtable:", err);
    return safeReadJSON(PRODUCTS_PATH);
  }
}

/* =========================================================
   AGGIORNA DATI PAYHIP (webhook)
========================================================= */
function updateFromPayhip(data) {
  try {
    const slug = safeSlug(data.slug);
    PAYHIP_CACHE[slug] = {
      price: data.price,
      title: data.title,
      image: data.image,
      url: data.url
    };

    // Ricarica Airtable + merge
    const current = safeReadJSON(PRODUCTS_PATH);
    const updated = current.map(p =>
      p.slug === slug ? mergeProduct(p, PAYHIP_CACHE[slug]) : p
    );

    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(updated, null, 2));

    console.log("Catalogo aggiornato da Payhip:", slug);

  } catch (err) {
    console.error("Errore updateFromPayhip:", err);
  }
}

/* =========================================================
   CARICAMENTO PRODOTTI (blindato)
========================================================= */
function loadProducts() {
  PRODUCTS = safeReadJSON(PRODUCTS_PATH);
  console.log("Catalogo caricato:", PRODUCTS.length, "prodotti");
}

function getProducts() {
  return PRODUCTS;
}

module.exports = {
  syncAirtable,
  loadProducts,
  getProducts,
  updateFromPayhip
};
