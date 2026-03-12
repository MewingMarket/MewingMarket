/**
 * =========================================================
 * File: app/modules/airtable-sync.cjs
 * Versione ULTRA — Anti-timeout + Normalizzazione totale + Categorie + Vendite
 * VERSIONE BUILD: 2026-03-13-00:10
 * =========================================================
 */

console.log("🟦 airtable-sync.cjs VERSIONE: 2026-03-13-00:10");

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

/* =========================================================
   PATH FILE LOCALE
========================================================= */
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");
const CATEGORIES_PATH = path.join(DATA_DIR, "categories.json");

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

function saveCategories(categories) {
  ensureDataDir();
  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2));
  console.log("📁 categories.json aggiornato");
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
  return str.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/* =========================================================
   NORMALIZZAZIONE NOMI CAMPI
========================================================= */
function normalizeFieldName(name) {
  if (!name) return "";
  return String(name)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "");
}

const FIELD_MAP = {
  slug: "Slug",
  titolo: "TitoloBreve",
  titolobreve: "TitoloBreve",
  titolo_breve: "TitoloBreve",
  prezzo: "Prezzo",
  costo: "Prezzo",
  tag: "Tag",
  categoria: "Tag",
  paypal: "paypal_link",
  paypallink: "paypal_link",
  youtube: "youtube_url",
  youtubelink: "youtube_url",
  descrizione: "DescrizioneLunga",
  descrizionelunga: "DescrizioneLunga",
  immagine: "Immagine",
  image: "Immagine",
  file: "File_consegna",
  fileconsegna: "File_consegna",
  file_consegna: "File_consegna"
};

function getFieldValue(fields, target) {
  const normalizedTarget = normalizeFieldName(target);

  for (const key of Object.keys(fields)) {
    const normalizedKey = normalizeFieldName(key);

    if (normalizedKey === normalizedTarget) return fields[key];
    if (FIELD_MAP[normalizedKey] === target) return fields[key];
  }

  return "";
}

/* =========================================================
   NORMALIZZAZIONE VALORI
========================================================= */
function safe(v) {
  if (v === undefined || v === null) return "";

  if (typeof v === "number") return v;
  if (typeof v === "string" && !isNaN(v.trim())) return Number(v.trim());

  if (typeof v === "string") {
    return v.normalize("NFKC").trim().replace(/\s+/g, " ");
  }

  if (Array.isArray(v)) return v.length ? v : [];
  if (typeof v === "object") return v;

  return String(v).trim();
}

/* =========================================================
   AUTO-GENERAZIONE SLUG
========================================================= */
function generateSlug(titolo) {
  return String(titolo || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

/* =========================================================
   NORMALIZZAZIONE CATEGORIA
========================================================= */
function normalizeCategory(cat) {
  if (!cat) return "";
  return String(cat)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function autoCategoryFromTitle(titolo) {
  if (!titolo) return "Generale";
  const words = String(titolo).split(" ");
  if (words.length === 1) return words[0];
  return words.slice(0, 2).join(" ");
}

/* =========================================================
   VALIDAZIONE PRODOTTO
========================================================= */
function validateProduct(p) {
  const errors = [];
  if (!p.titolo) errors.push("Titolo mancante");
  if (!p.slug) errors.push("Slug mancante");
  if (p.prezzo < 0) errors.push("Prezzo negativo");
  return errors;
}

/* =========================================================
   SYNC AIRTABLE — PRODOTTI (CRON)
========================================================= */

async function syncAirtable() {
  console.log("🟦 SYNC START — VERSIONE: 2026-03-13-00:10");

  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    const RAW_NAME = process.env.AIRTABLE_TABLE_NAME;
    const RAW_ID = process.env.AIRTABLE_TABLE_ID;

    const NORMALIZED_NAME = normalizeName(RAW_NAME);
    const EXPECTED_NAME = normalizeName("Catalogo prodotti digitali");

    console.log("===== DEBUG AIRTABLE =====");
    console.log("📌 BASE ID:", BASE || "(mancante)");
    console.log("📌 TABLE_NAME:", RAW_NAME);
    console.log("📌 TABLE_ID:", RAW_ID);
    console.log("==========================");

    if (!PAT || !BASE || (!RAW_NAME && !RAW_ID)) {
      console.log("⏭️ Sync Airtable saltata: variabili mancanti");
      return false;
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);

    let tableIdentifier =
      NORMALIZED_NAME === EXPECTED_NAME ? RAW_NAME : RAW_ID;

    console.log("📌 Uso tabella:", tableIdentifier);

    let allRecords = [];

    await base(tableIdentifier)
      .select({ pageSize: 50 })
      .eachPage(
        (records, fetchNextPage) => {
          console.log(`📦 Pagina ricevuta: ${records.length} record`);
          allRecords = allRecords.concat(records);
          fetchNextPage();
        },
        (err) => {
          if (err) throw err;
        }
      );

    console.log("🔎 Totale record letti:", allRecords.length);

    if (!allRecords.length) {
      console.log("⚠️ Nessun record trovato — uso catalogo locale");
      const local = loadProducts();
      saveProductsToFile(local);
      console.log("🟦 SYNC END (fallback) — VERSIONE: 2026-03-13-00:10");
      return true;
    }

    const products = allRecords.map((r) => {
      const f = r.fields || {};

      let titolo = safe(getFieldValue(f, "TitoloBreve"));
      let slug = safe(getFieldValue(f, "Slug"));
      let categoria = safe(getFieldValue(f, "Tag"));

      if (!slug) slug = generateSlug(titolo);

      categoria = normalizeCategory(categoria);
      if (!categoria) categoria = normalizeCategory(autoCategoryFromTitle(titolo));

      const prodotto = {
        id: r.id,
        slug,
        titolo,
        prezzo: safe(getFieldValue(f, "Prezzo")) || 0,
        categoria,
        paypal_link: safe(getFieldValue(f, "paypal_link")),
        youtube_url: safe(getFieldValue(f, "youtube_url")),
        descrizione: safe(getFieldValue(f, "DescrizioneLunga")),

        immagine: (() => {
          const img = safe(getFieldValue(f, "Immagine"));
          return Array.isArray(img) && img[0]?.url ? img[0].url : "";
        })(),

        fileProdotto: (() => {
          const file = safe(getFieldValue(f, "File_consegna"));
          return Array.isArray(file) && file[0]?.url ? file[0].url : "";
        })()
      };

      const errors = validateProduct(prodotto);
      if (errors.length) {
        console.log("⚠️ Prodotto con problemi:", prodotto.slug, errors);
      }

      return prodotto;
    });

    saveProductsToFile(products);

    const categories = [...new Set(products.map(p => p.categoria))]
      .filter(Boolean)
      .sort();

    saveCategories(categories);

    console.log("📚 Categorie generate:", categories);
    console.log("🟢 Sync Airtable COMPLETATA:", products.length, "prodotti");
    console.log("🟦 SYNC END — VERSIONE: 2026-03-13-00:10");
    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);

    const local = loadProducts();
    saveProductsToFile(local);
    console.log("🟦 SYNC END (errore + fallback) — VERSIONE: 2026-03-13-00:10");
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
