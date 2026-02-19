/**
 * app/modules/airtable.cjs
 * Versione definitiva con PATCH anti-cache + auto-create directory
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");

// ⭐ READY FLAG — il bot risponde solo quando è true
global.catalogReady = false;

let PRODUCTS_CACHE = [];
let SALES_CACHE = {};

/* =========================================================
   CREA CARTELLA SE NON ESISTE
========================================================= */
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log("📁 Cartella /data ricreata");
    }
  } catch (err) {
    console.error("❌ Errore creazione cartella /data:", err);
  }
}

/* =========================================================
   SALVATAGGIO SU FILE
========================================================= */
function saveProductsToFile(products) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
    console.log("💾 products.json aggiornato");
  } catch (err) {
    console.error("❌ Errore salvataggio products.json:", err);
  }
}

/* =========================================================
   CARICAMENTO DA FILE (PATCH: NON attivare catalogReady)
========================================================= */
function loadProducts() {
  try {
    ensureDataDir();

    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, "utf8");
      PRODUCTS_CACHE = JSON.parse(raw);

      console.log("📦 Catalogo caricato da file (catalogReady = false)");
      // ❗ PATCH: NON impostare catalogReady qui
    }
  } catch (err) {
    console.error("❌ Errore loadProducts:", err);
  }
  return PRODUCTS_CACHE;
}

/* =========================================================
   GET PRODUCTS — blindato
========================================================= */
function getProducts() {
  return Array.isArray(PRODUCTS_CACHE) ? PRODUCTS_CACHE : [];
}

/* =========================================================
   SYNC AIRTABLE (VERSIONE DEFINITIVA)
========================================================= */
async function syncAirtable() {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;
    const TABLE = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE || !TABLE) {
      console.log("⏭️ Airtable sync skipped: missing PAT / BASE / TABLE_NAME");
      return false;
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);
    const tableName = decodeURIComponent(TABLE);

    const records = await base(tableName).select({}).all();

    const products = records.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        slug: f.Slug || "",
        titolo: f.Titolo || "",
        titoloBreve: f.TitoloBreve || "",
        descrizione: f.Descrizione || "",
        descrizioneBreve: f.DescrizioneBreve || "",
        prezzo: f.Prezzo || 0,
        immagine: f.Immagine || [],
        linkPayhip: f.LinkPayhip || "",
        youtube_url: f.youtube_url || "",
        youtube_title: f.youtube_title || "",
        youtube_description: f.youtube_description || "",
        youtube_thumbnail: f.youtube_thumbnail || "",
        youtube_last_video_url: f.youtube_last_video_url || "",
        youtube_last_video_title: f.youtube_last_video_title || "",
        categoria: f.Categoria || ""
      };
    });

    PRODUCTS_CACHE = products;
    saveProductsToFile(products);

    // ⭐ READY FLAG → ora il bot può rispondere
    global.catalogReady = true;
    console.log("🟢 Airtable sync OK:", products.length, "prodotti (catalogReady = true)");

    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);
    return false;
  }
}

module.exports = {
  loadProducts,
  getProducts,
  syncAirtable
};
