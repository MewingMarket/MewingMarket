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

/* Moduli Payhip + YouTube */
const { updateFromPayhip: updatePayhipModule } = require("./payhip.cjs");
const { updateFromYouTube: updateYouTubeModule } = require("./youtube.cjs");

/* ============================== VARIABILI AMBIENTE ============================== */
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE;

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

/* ============================== SYNC AIRTABLE → products.json ============================== */
async function syncAirtable() {
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!Array.isArray(data.records)) return safeReadJSON(PRODUCTS_PATH);

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
  if (!id) return;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

  await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
}

/* ============================== FUNZIONI CHE IL SERVER SI ASPETTA ============================== */

/* Carica products.json */
function loadProducts() {
  return safeReadJSON(PRODUCTS_PATH);
}

/* Alias richiesto dal server */
function getProducts() {
  return loadProducts();
}

/* Proxy verso il modulo Payhip */
async function updateFromPayhip(data) {
  await updatePayhipModule(data);
  await syncAirtable();
}

/* Proxy verso il modulo YouTube */
async function updateFromYouTube(video) {
  await updateYouTubeModule(video);
  await syncAirtable();
}

/* Salva vendita */
async function saveSaleToAirtable(fields) {
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
  loadProducts,
  getProducts,
  updateFromPayhip,
  updateFromYouTube,
  updateAirtableRecord,
  saveSaleToAirtable
};
