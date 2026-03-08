/**
 * =========================================================
 * File: app/modules/airtable.cjs
 * Versione definitiva REAL‑TIME:
 * - Delta sync (solo record modificati)
 * - Nessun timeout, nessun retry
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
const META_PATH = path.join(DATA_DIR, "airtable-meta.json");

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
   SYNC AIRTABLE — DELTA SYNC REAL‑TIME
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

  const meta = loadMeta();
  const lastSync = meta.lastSync;

  console.log(`📡 Delta Sync Airtable (modifiche dopo ${lastSync})…`);

  const updated = [];

  try {
    await base(tableName)
      .select({
        filterByFormula: `LAST_MODIFIED_TIME() > '${lastSync}'`,
        pageSize: 50
      })
      .eachPage((records, next) => {
        updated.push(...records);
        next();
      });
  } catch (err) {
    console.error("❌ Errore Airtable:", err.message);
    return false;
  }

  if (updated.length === 0) {
    console.log("⏭️ Nessuna modifica — sync istantanea");
    global.catalogReady = true;
    return true;
  }

  console.log(`🔄 Modifiche trovate: ${updated.length}`);

  // Carica catalogo locale
  loadProducts();

  // Applica modifiche
  for (const r of updated) {
    const f = r.fields;

    const incoming = {
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

    const index = PRODUCTS_CACHE.findIndex((p) => p.id === r.id);

    if (index === -1) {
      PRODUCTS_CACHE.push(incoming);
      console.log("➕ Nuovo prodotto:", incoming.slug);
    } else {
      PRODUCTS_CACHE[index] = { ...PRODUCTS_CACHE[index], ...incoming };
      console.log("♻️ Prodotto aggiornato:", incoming.slug);
    }
  }

  saveProductsToFile(PRODUCTS_CACHE);

  const now = new Date().toISOString();
  saveMeta({ lastSync: now });

  global.catalogReady = true;

  console.log("🟢 Delta Sync Airtable completata");
  return true;
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
