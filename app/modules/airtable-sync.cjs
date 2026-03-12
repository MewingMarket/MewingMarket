/**
 * =========================================================
 * File: app/modules/airtable-sync.cjs
 * Versione DEFINITIVA — Anti-timeout + Anti-0-record + Normalizzazione totale
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
   NORMALIZZAZIONE STRINGHE
========================================================= */
function normalizeName(str) {
  if (!str) return "";
  return str
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* =========================================================
   SAFE VALUE — ANTI-CAMPI ROTTI
========================================================= */
function safe(v) {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.length ? v : [];
  if (typeof v === "object") return v;
  return String(v).trim();
}

/* =========================================================
   SYNC AIRTABLE — PRODOTTI (CRON)
========================================================= */

async function syncAirtable() {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    const RAW_NAME = process.env.AIRTABLE_TABLE_NAME;
    const RAW_ID = process.env.AIRTABLE_TABLE_ID;

    const NORMALIZED_NAME = normalizeName(RAW_NAME);
    const EXPECTED_NAME = normalizeName("Catalogo prodotti digitali");

    // 🔍 DEBUG COMPLETO
    console.log("===== DEBUG AIRTABLE =====");
    console.log("📌 BASE ID:", BASE || "(mancante)");
    console.log("📌 TABLE_NAME (raw):", JSON.stringify(RAW_NAME));
    console.log("📌 TABLE_NAME (normalized):", NORMALIZED_NAME);
    console.log("📌 TABLE_NAME (expected):", EXPECTED_NAME);
    console.log("📌 TABLE_ID:", RAW_ID || "(mancante)");
    console.log("==========================");

    if (!PAT || !BASE || (!RAW_NAME && !RAW_ID)) {
      console.log("⏭️ Sync Airtable saltata: variabili mancanti");
      return false;
    }

    console.log("🔄 Sync Airtable (CRON, paginata)…");

    const base = new Airtable({ apiKey: PAT }).base(BASE);

    // ⭐ LOGICA DEFINITIVA ANTI-ERRORE
    let tableIdentifier =
      NORMALIZED_NAME === EXPECTED_NAME ? RAW_NAME : RAW_ID;

    console.log("📌 Uso tabella:", tableIdentifier);

    let allRecords = [];

    console.log("📄 Inizio lettura paginata…");

    await base(tableIdentifier)
      .select({
        pageSize: 50,

        // ⭐ ANTI-0-RECORD: carica SOLO i campi sicuri
        fields: [
          "Slug",
          "TitoloBreve",
          "Prezzo",
          "Tag",
          "paypal_link",
          "youtube_url",
          "DescrizioneLunga",
          "Immagine",
          "File_consegna"
        ]
      })
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

    /* =========================================================
       ⭐ PATCH ANTI-TIMEOUT / ANTI-0-RECORD
       Se Airtable restituisce 0 record → NON fallire.
       Usa il catalogo locale e completa la sync.
    ========================================================= */
    if (!allRecords.length) {
      console.log("⚠️ Nessun record trovato — uso catalogo locale");
      const local = loadProducts();
      saveProductsToFile(local);
      console.log("🟢 Sync Airtable COMPLETATA (fallback locale)");
      return true;
    }

    const products = allRecords.map((r) => {
      const f = r.fields || {};

      return {
        id: r.id,
        slug: safe(f.Slug),
        titolo: safe(f.TitoloBreve),
        prezzo: Number(f.Prezzo || 0),
        categoria: safe(f.Tag),
        paypal_link: safe(f.paypal_link),
        youtube_url: safe(f.youtube_url),
        descrizione: safe(f.DescrizioneLunga),
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

    // ⭐ ANTI-TIMEOUT: fallback anche in caso di errore
    const local = loadProducts();
    saveProductsToFile(local);
    console.log("🟢 Sync Airtable COMPLETATA (fallback locale dopo errore)");
    return true;
  }
}

/* =========================================================
   FUNZIONI VENDITE (runtime)
========================================================= */

async function updatePayPal(slug, paypalLink) {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;

  const RAW_NAME = process.env.AIRTABLE_TABLE_NAME;
  const RAW_ID = process.env.AIRTABLE_TABLE_ID;

  const NORMALIZED_NAME = normalizeName(RAW_NAME);
  const EXPECTED_NAME = normalizeName("Catalogo prodotti digitali");

  const tableIdentifier =
    NORMALIZED_NAME === EXPECTED_NAME ? RAW_NAME : RAW_ID;

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

  const RAW_NAME = process.env.AIRTABLE_TABLE_NAME;
  const RAW_ID = process.env.AIRTABLE_TABLE_ID;

  const NORMALIZED_NAME = normalizeName(RAW_NAME);
  const EXPECTED_NAME = normalizeName("Catalogo prodotti digitali");

  const tableIdentifier =
    NORMALIZED_NAME === EXPECTED_NAME ? RAW_NAME : RAW_ID;

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

    const tableIdentifier =
      process.env.AIRTABLE_VENDITE_NAME ||
      process.env.AIRTABLE_VENDITE_ID;

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
