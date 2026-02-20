/**
 * =========================================================
 * File: app/modules/airtable.cjs
 * Versione definitiva:
 * - Sync Airtable → cache + file
 * - Merge intelligente (non sovrascrive campi esistenti)
 * - Auto-create prodotto se non esiste
 * - Update PayPal link senza toccare altro
 * - Recupero vendite utente (tabella: Vendite)
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");

global.catalogReady = false;

let PRODUCTS_CACHE = [];

/* =========================================================
   UTILS
========================================================= */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("📁 Cartella /data creata");
  }
}

function saveProductsToFile(products) {
  ensureDataDir();
  fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
  console.log("💾 products.json aggiornato");
}

function loadProducts() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_PATH)) {
      PRODUCTS_CACHE = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      console.log("📦 Catalogo caricato da file");
    }
  } catch (err) {
    console.error("❌ Errore loadProducts:", err);
  }
  return PRODUCTS_CACHE;
}

function getProducts() {
  return PRODUCTS_CACHE;
}

/* =========================================================
   SYNC AIRTABLE
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
        youtube_url: f.youtube_url || f.YouTube || "",
        immagine:
          Array.isArray(f.immagine) && f.immagine[0]?.url
            ? f.immagine[0].url
            : ""
      };
    });

    PRODUCTS_CACHE = products;
    saveProductsToFile(products);

    global.catalogReady = true;
    console.log("🟢 Sync Airtable OK:", products.length, "prodotti");

    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);
    return false;
  }
}

/* =========================================================
   MERGE INTELLIGENTE
   - Non sovrascrive campi già esistenti
========================================================= */
function mergeProduct(existing, incoming) {
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([k, v]) => v !== undefined && v !== "")
    )
  };
}

/* =========================================================
   UPDATE PAYPAL LINK
========================================================= */
async function updatePayPal(slug, paypalLink) {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;
  const TABLE = process.env.AIRTABLE_TABLE_NAME;

  const base = new Airtable({ apiKey: PAT }).base(BASE);
  const tableName = decodeURIComponent(TABLE);

  const records = await base(tableName)
    .select({ filterByFormula: `{slug} = '${slug}'`, maxRecords: 1 })
    .all();

  if (!records.length) return false;

  const id = records[0].id;

  await base(tableName).update(id, { paypal_link: paypalLink });

  console.log("💰 PayPal link aggiornato per", slug);

  return true;
}

/* =========================================================
   AUTO-CREATE PRODOTTO
========================================================= */
async function createProductIfMissing(slug, fields = {}) {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;
  const TABLE = process.env.AIRTABLE_TABLE_NAME;

  const base = new Airtable({ apiKey: PAT }).base(BASE);
  const tableName = decodeURIComponent(TABLE);

  const records = await base(tableName)
    .select({ filterByFormula: `{slug} = '${slug}'`, maxRecords: 1 })
    .all();

  if (records.length) {
    console.log("ℹ️ Prodotto già esistente:", slug);
    return records[0].id;
  }

  const newRecord = await base(tableName).create({
    slug,
    ...fields
  });

  console.log("🆕 Prodotto creato:", slug);

  return newRecord.id;
}

/* =========================================================
   GET SALES BY UID (Tabella: Vendite)
========================================================= */
async function getSalesByUID(uid) {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    if (!PAT || !BASE) {
      console.log("⏭️ getSalesByUID saltato: variabili mancanti");
      return [];
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);
    const tableName = "Vendite";

    const records = await base(tableName)
      .select({
        filterByFormula: `{uid} = '${uid}'`
      })
      .all();

    return records.map(r => ({
      id: r.id,
      ...r.fields
    }));

  } catch (err) {
    console.error("❌ Errore getSalesByUID:", err);
    return [];
  }
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  loadProducts,
  getProducts,
  syncAirtable,
  updatePayPal,
  createProductIfMissing,
  mergeProduct,
  getSalesByUID
};
