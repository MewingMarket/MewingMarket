/**
 * =========================================================
 * File: app/modules/airtable-sync.cjs
 * Versione DEFINITIVA — Prodotti (CRON) + Vendite (runtime)
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

/* =========================================================
   PATH FILE LOCALE
========================================================= */
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");

/* =========================================================
   UTILS FILE
========================================================= */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("📁 Cartella /data creata");
  }
}

function saveProductsToFile(products) {
  ensureDataDir();

  const tempPath = DATA_PATH + ".tmp";
  fs.writeFileSync(tempPath, JSON.stringify(products, null, 2));
  fs.renameSync(tempPath, DATA_PATH);

  console.log("💾 products.json aggiornato (scrittura atomica)");
}

function loadProducts() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error("❌ Errore loadProducts:", err);
  }
  return [];
}

function getProducts() {
  return loadProducts();
}

/* =========================================================
   SYNC AIRTABLE — SOLO PRODOTTI (CRON) — VERSIONE PAGINATA
   CON FALLBACK NAME → ID
========================================================= */

async function syncAirtable() {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    // Nome tabella (opzionale)
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    // ID tabella (fallback sicuro)
    const TABLE_ID = process.env.AIRTABLE_TABLE_ID;

    if (!PAT || !BASE || (!TABLE_NAME && !TABLE_ID)) {
      console.log("⏭️ Sync Airtable saltata: variabili mancanti");
      return false;
    }

    console.log("🔄 Sync Airtable (CRON, paginata)…");

    const base = new Airtable({ apiKey: PAT }).base(BASE);

    // Se TABLE_NAME esiste → usa quello
    // Altrimenti → usa TABLE_ID
    const tableIdentifier = TABLE_NAME || TABLE_ID;

    console.log("📌 Uso tabella:", tableIdentifier);

    let allRecords = [];

    console.log("📄 Inizio lettura paginata…");

    await base(tableIdentifier)
      .select({ pageSize: 50 })
      .eachPage(
        function page(records, fetchNextPage) {
          console.log(`📦 Pagina ricevuta: ${records.length} record`);
          allRecords = allRecords.concat(records);
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error("❌ Errore paginazione Airtable:", err);
            throw err;
          }
        }
      );

    console.log("🔎 Totale record letti:", allRecords.length);

    if (!allRecords.length) {
      console.log("⚠️ Nessun record trovato");
      return false;
    }

    const products = allRecords.map((r) => {
      const f = r.fields;

      return {
        id: r.id,
        slug: f.Slug || "",
        titolo: f.TitoloBreve || "",
        prezzo: f.Prezzo || 0,
        categoria: f.Tag || "",
        paypal_link: f.paypal_link || "",
        youtube_url: f.youtube_url || "",
        descrizione: f.DescrizioneLunga || "",
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

    saveProductsToFile(products);

    console.log("🟢 Sync Airtable COMPLETATA:", products.length, "prodotti");
    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);
    return false;
  }
}

/* =========================================================
   FUNZIONI VENDITE (runtime, NON CRON)
========================================================= */

async function updatePayPal(slug, paypalLink) {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;

  const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
  const TABLE_ID = process.env.AIRTABLE_TABLE_ID;
  const tableIdentifier = TABLE_NAME || TABLE_ID;

  const base = new Airtable({ apiKey: PAT }).base(BASE);

  const records = await base(tableIdentifier)
    .select({
      filterByFormula: `{Slug} = '${slug}'`,
      maxRecords: 1
    })
    .all();

  if (!records.length) return false;

  const id = records[0].id;

  await base(tableIdentifier).update(id, { paypal_link: paypalLink });

  console.log("💰 PayPal link aggiornato per", slug);

  return true;
}

async function createProductIfMissing(slug, fields = {}) {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;

  const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
  const TABLE_ID = process.env.AIRTABLE_TABLE_ID;
  const tableIdentifier = TABLE_NAME || TABLE_ID;

  const base = new Airtable({ apiKey: PAT }).base(BASE);

  const records = await base(tableIdentifier)
    .select({
      filterByFormula: `{Slug} = '${slug}'`,
      maxRecords: 1
    })
    .all();

  if (records.length) {
    console.log("ℹ️ Prodotto già esistente:", slug);
    return records[0].id;
  }

  const newRecord = await base(tableIdentifier).create({
    Slug: slug,
    ...fields
  });

  console.log("🆕 Prodotto creato:", slug);

  return newRecord.id;
}

async function getSalesByUID(uid) {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    if (!PAT || !BASE) {
      console.log("⏭️ getSalesByUID saltato: variabili mancanti");
      return [];
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);

    const tableIdentifier = process.env.AIRTABLE_VENDITE_NAME || process.env.AIRTABLE_VENDITE_ID;

    const records = await base(tableIdentifier)
      .select({
        filterByFormula: `{UID} = '${uid}'`
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
  syncAirtable,
  getProducts,
  loadProducts,
  updatePayPal,
  createProductIfMissing,
  getSalesByUID,
  mergeProduct: (a, b) => ({ ...a, ...b })
};
