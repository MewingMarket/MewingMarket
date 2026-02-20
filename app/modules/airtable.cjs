/**
 * =========================================================
 * File: app/modules/airtable.cjs
 * Modulo Airtable definitivo per il nuovo store interno
 * - Sync Airtable → cache interna + products.json
 * - Anti-cache
 * - Auto-create directory
 * - Campi coerenti con prodotto.js / catalogo.js / index.js
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");

// Flag globale: il catalogo è pronto solo dopo sync Airtable
global.catalogReady = false;

// Cache interna
let PRODUCTS_CACHE = [];

/* =========================================================
   CREA CARTELLA /data SE NON ESISTE
========================================================= */
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log("📁 Cartella /data creata");
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
   CARICAMENTO DA FILE (senza attivare catalogReady)
========================================================= */
function loadProducts() {
  try {
    ensureDataDir();

    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, "utf8");
      PRODUCTS_CACHE = JSON.parse(raw);

      console.log("📦 Catalogo caricato da file (catalogReady = false)");
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
   SYNC AIRTABLE → CACHE + FILE
========================================================= */
async function syncAirtable() {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;
    const TABLE = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE || !TABLE) {
      console.log("⏭️ Sync Airtable saltato: variabili mancanti");
      return false;
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);
    const tableName = decodeURIComponent(TABLE);

    const records = await base(tableName).select({}).all();

    const products = records.map((r) => {
      const f = r.fields;

      return {
        id: r.id,
        slug: f.slug || f.Slug || "",
        titolo: f.titolo || f.Titolo || "",
        titolo_breve: f.titolo_breve || f.TitoloBreve || "",
        descrizione: f.descrizione || f.Descrizione || "",
        descrizione_breve: f.descrizione_breve || f.DescrizioneBreve || "",
        prezzo: f.prezzo || f.Prezzo || 0,
        categoria: f.categoria || f.Categoria || "",
        paypal_link: f.paypal_link || f.PayPal || "",
        youtube_url: f.youtube_url || "",
        immagine:
          Array.isArray(f.immagine) && f.immagine[0]?.url
            ? f.immagine[0].url
            : ""
      };
    });

    PRODUCTS_CACHE = products;
    saveProductsToFile(products);

    global.catalogReady = true;
    console.log("🟢 Sync Airtable OK:", products.length, "prodotti (catalogReady = true)");

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
