/**
 * =========================================================
 * File: app/modules/airtable-sync.cjs
 * Versione DEFINITIVA Render‑Friendly + LOG DIAGNOSTICI
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");
const META_PATH = path.join(DATA_DIR, "airtable-meta.json");

let PRODUCTS_CACHE = [];
global.catalogReady = false;

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

function loadMeta() {
  try {
    if (fs.existsSync(META_PATH)) {
      return JSON.parse(fs.readFileSync(META_PATH, "utf8"));
    }
  } catch {}
  return { lastSync: "1970-01-01T00:00:00.000Z" };
}

function saveMeta(meta) {
  ensureDataDir();
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

/* =========================================================
   SYNC AIRTABLE — VERSIONE RENDER‑FRIENDLY
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

    console.log("📡 Sync Airtable…");

    // ⭐ LOG DIAGNOSTICI
    console.log("🔍 DEBUG Airtable:");
    console.log("   BASE  =", BASE);
    console.log("   TABLE =", `"${tableName}"`);
    console.log("   PAT   =", PAT ? "OK" : "MISSING");

    // ⭐ LOG per capire se la query parte
    console.log("🔎 Eseguo select().all()…");

    const records = await base(tableName).select({}).all();

    console.log("🔎 Query completata, records:", records.length);

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
        descrizione:
          f.DescrizioneLunga ||
          f.descrizione ||
          f.Descrizione ||
          "",
        immagine:
          Array.isArray(f.Immagine) && f.Immagine[0]?.url
            ? f.Immagine[0].url
            : "",
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
    console.error("❌ Errore syncAirtable:", err);
    return false;
  }
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
   GET SALES BY UID
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
  mergeProduct: (a, b) => ({ ...a, ...b }),
  getSalesByUID
};
