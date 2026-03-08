/**
 * =========================================================
 * File: app/modules/airtable.cjs
 * Versione definitiva blindata:
 * - Sync Airtable → cache + file
 * - Timeout + retry + paginazione
 * - Nessuna promise pendente
 * - Usa DescrizioneLunga come descrizione principale
 * - Descrizione breve generata da codice (non da Airtable)
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
   TIMEOUT + RETRY + PAGINAZIONE
========================================================= */

// Timeout helper
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout Airtable (${ms}ms)`)), ms)
    )
  ]);
}

// Retry wrapper
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`⚠️ Tentativo ${i + 1} fallito:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/* =========================================================
   SYNC AIRTABLE — versione blindata
========================================================= */
async function syncAirtable() {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;
  const TABLE = process.env.AIRTABLE_TABLE_NAME;

  if (!PAT || !BASE || !TABLE) {
    console.log("⏭️ Sync Airtable saltato: variabili mancanti");
    return false;
  }

  const base = new Airtable({ apiKey: PAT }).base(BASE);
  const tableName = decodeURIComponent(TABLE);

  async function fetchPage() {
    return new Promise((resolve, reject) => {
      const results = [];

      base(tableName)
        .select({ pageSize: 50 })
        .eachPage(
          (records, next) => {
            results.push(...records);
            next();
          },
          (err) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
    });
  }

  try {
    console.log("📡 Sync Airtable…");

    // Timeout + retry + paginazione
    const records = await retry(
      () => withTimeout(fetchPage(), 10000),
      3,
      1000
    );

    const products = records.map((r) => {
      const f = r.fields;

      return {
        id: r.id,
        slug: f.slug || f.Slug || "",
        titolo: f.titolo || f.Titolo || "",
        prezzo: f.prezzo || f.Prezzo || 0,
        categoria: f.categoria || f.Categoria || "",
        paypal_link: f.paypal_link || f.PayPal || "",
        youtube_url: f.youtube_url || f.YouTube || "",

        // ⭐ DESCRIZIONE LUNGA — campo principale
        descrizione:
          f.DescrizioneLunga ||
          f.descrizione ||
          f.Descrizione ||
          "",

        // ⭐ IMMAGINE PRINCIPALE
        immagine:
          Array.isArray(f.Immagine) && f.Immagine[0]?.url
            ? f.Immagine[0].url
            : "",

        // ⭐ FILE PRODOTTO
        fileProdotto:
          Array.isArray(f.File_consegna) && f.File_consegna[0]?.url
            ? f.File_consegna[0].url
            : ""
      };
    });

    PRODUCTS_CACHE = products;
    saveProductsToFile(products);

    global.catalogReady = true;
    console.log("🟢 Sync Airtable OK:", products.length, "prodotti");

    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err.message);
    return false;
  }
}

/* =========================================================
   MERGE INTELLIGENTE
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

    return records.map((r) => ({
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
