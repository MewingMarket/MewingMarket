/* ============================== IMPORT ============================== */
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const {
  safeSlug,
  cleanText,
  cleanNumber,
  cleanURL,
  stripHTML,
  safeText,
  shorten,
  normalize
} = require(path.join(__dirname, "utils.cjs"));

/* ============================== VARIABILI AMBIENTE ============================== */
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE;

if (!AIRTABLE_PAT || !BASE_ID || !TABLE_NAME) {
  console.error("❌ Airtable non è configurato correttamente: variabili ambiente mancanti.");
}

/* ============================== CACHE ============================== */
let PRODUCTS = [];
let PAYHIP_CACHE = {};

const PRODUCTS_PATH = path.join(__dirname, "..", "data", "products.json");

/* ============================== LETTURA JSON ============================== */
function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

/* ============================== MERGE PRODOTTO ============================== */
function mergeProduct(airtable, payhip) {
  if (!airtable) return null;
  if (!payhip) return airtable;

  return {
    ...airtable,
    prezzo: payhip.price ?? airtable.prezzo,
    titolo: payhip.title ?? airtable.titolo,
    immagine: payhip.image ?? airtable.immagine,
    linkPayhip: payhip.url ?? airtable.linkPayhip
  };
}

/* ============================== SYNC AIRTABLE → products.json ============================== */
async function syncAirtable() {
  try {
    if (!AIRTABLE_PAT || !BASE_ID || !TABLE_NAME) {
      return safeReadJSON(PRODUCTS_PATH);
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!Array.isArray(data.records)) {
      return safeReadJSON(PRODUCTS_PATH);
    }

    const records = data.records.map(r => ({
      id: r.id,
      ...r.fields
    }));

    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(records, null, 2));
    return records;

  } catch {
    return safeReadJSON(PRODUCTS_PATH);
  }
}

/* ============================== UPDATE RECORD ============================== */
async function updateAirtableRecord(id, fields) {
  if (!id || typeof id !== "string") return;
  if (!fields || typeof fields !== "object") return;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Airtable update error:", text);
  }
}

/* ============================== SALVA VENDITA ============================== */
async function saveSaleToAirtable(fields) {
  if (!fields || typeof fields !== "object") return;

  const url = `https://api.airtable.com/v0/${BASE_ID}/Vendite`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
}

/* ============================== EXPORT ============================== */
module.exports = {
  syncAirtable,
  safeReadJSON,
  updateAirtableRecord,
  saveSaleToAirtable
};
