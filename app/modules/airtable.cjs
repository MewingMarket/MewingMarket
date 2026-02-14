/* ============================== IMPORT ============================== */
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

/* ============================== VARIABILI AMBIENTE ============================== */
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;

// ⭐ Nuove variabili
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;   // Nome tabella (REST API)
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;       // Solo informativo

const PRODUCTS_PATH = path.join(__dirname, "..", "data", "products.json");

/* ============================== DEBUG CONFIG ============================== */
function debugConfig() {
  console.log("🔧 [DEBUG] Airtable Config (airtable.cjs):");
  console.log("   BASE_ID:", BASE_ID);
  console.log("   TABLE_NAME:", TABLE_NAME);
  console.log("   TABLE_ID (informativo):", TABLE_ID);
}

/* ============================== LETTURA JSON ============================== */
function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ============================== SYNC AIRTABLE → products.json ============================== */
async function syncAirtable() {
  try {
    debugConfig();

    // 🔥 Usiamo SEMPRE il nome tabella
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?view=Grid%20view`;

    console.log("📡 [DEBUG] syncAirtable → GET:", url);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ [DEBUG] Errore syncAirtable:", data.error);
      return safeReadJSON(PRODUCTS_PATH);
    }

    if (!Array.isArray(data.records)) {
      console.error("❌ [DEBUG] Nessun record trovato in Airtable.");
      return safeReadJSON(PRODUCTS_PATH);
    }

    const records = data.records.map(r => ({
      id: r.id,
      ...r.fields
    }));

    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(records, null, 2));

    console.log("🟢 [DEBUG] syncAirtable completato. Prodotti salvati:", records.length);

    return records;

  } catch (err) {
    console.error("❌ [DEBUG] Errore syncAirtable:", err);
    return safeReadJSON(PRODUCTS_PATH);
  }
}

/* ============================== UPDATE RECORD ============================== */
async function updateAirtableRecord(id, fields) {
  if (!id) return;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

  console.log("✏️ [DEBUG] updateAirtableRecord → PATCH:", id);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const data = await res.json();

  if (data.error) {
    console.error("❌ [DEBUG] Errore updateAirtableRecord:", data.error);
  }
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

/* Salva vendita */
async function saveSaleToAirtable(fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/Vendite`;

  console.log("💰 [DEBUG] saveSaleToAirtable → POST");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const data = await res.json();

  if (data.error) {
    console.error("❌ [DEBUG] Errore saveSaleToAirtable:", data.error);
  }
}

/* ============================== EXPORT ============================== */
module.exports = {
  syncAirtable,
  loadProducts,
  getProducts,
  updateAirtableRecord,
  saveSaleToAirtable
};
