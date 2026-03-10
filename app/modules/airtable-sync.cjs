/**
 * =========================================================
 * File: app/modules/airtable-sync.cjs
 * Versione DEFINITIVA — Anti Timeout, Anti Catalogo Vuoto,
 * Una sola sync per processo, Render‑Friendly
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");

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
      console.log("📦 Catalogo caricato (cache locale)");
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
   SYNC AIRTABLE — UNA SOLA VOLTA PER PROCESSO
   - Timeout sicuro
   - Mai sovrascrivere con 0 record
   - Mai più sync multiple
========================================================= */

let SYNC_ALREADY_DONE = false;

async function syncAirtable() {
  // 🔒 Blocco totale: una sola sync per processo
  if (SYNC_ALREADY_DONE) {
    console.log("⏭️ Sync Airtable saltata: già eseguita in questo processo");
    return true;
  }

  // 🔒 La marchiamo SUBITO come eseguita
  SYNC_ALREADY_DONE = true;

  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;
    const TABLE = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE || !TABLE) {
      console.log("⏭️ Sync Airtable saltata: variabili mancanti");
      return false;
    }

    console.log("📡 Sync Airtable (una sola volta per processo)…");

    const base = new Airtable({ apiKey: PAT }).base(BASE);
    const tableName = decodeURIComponent(TABLE);

    console.log("🔍 DEBUG Airtable:");
    console.log("   BASE  =", BASE);
    console.log("   TABLE =", `"${tableName}"`);
    console.log("   PAT   =", PAT ? "OK" : "MISSING");

    console.log("🔎 Eseguo select().all()…");

    // Timeout di sicurezza: se Airtable non risponde → NON svuotare il catalogo
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve("TIMEOUT"), 8000)
    );

    const airtablePromise = base(tableName).select({}).all();

    const result = await Promise.race([airtablePromise, timeoutPromise]);

    if (result === "TIMEOUT") {
      console.log("⏭️ Sync Airtable annullata: TIMEOUT (catalogo preservato)");
      return false;
    }

    const records = result;

    console.log("🔎 Query completata, records:", records.length);

    // Se Airtable risponde vuoto → NON sovrascrivere il catalogo
    if (!records.length) {
      console.log("⏭️ Sync Airtable annullata: 0 record (catalogo preservato)");
      return false;
    }

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

    console.log("🟢 Sync Airtable COMPLETATA:", products.length, "prodotti");
    console.log("🛑 Sync Airtable DISATTIVATA per il resto della sessione");

    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);
    console.log("⏭️ Catalogo preservato (nessuna sovrascrittura)");
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
