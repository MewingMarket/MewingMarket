/* ============================== IMPORT ============================== */
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

function getExistingSlugs() {
  try {
    const file = fs.readFileSync(path.join(__dirname, "../../data/products.json"), "utf8");
    const data = JSON.parse(file);
    return data.map(p => p.slug);
  } catch {
    return [];
  }
}

/* ============================== VARIABILI AMBIENTE ============================== */
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;

// ⭐ Nuove variabili
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;

// ⭐ PATCH: percorso corretto
const PRODUCTS_PATH = path.join(__dirname, "../../data/products.json");

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

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?view=Grid%20view`;

    console.log("📡 [DEBUG] syncAirtable → GET:", url);
    const oldSlugs = getExistingSlugs();

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

    const records = data.records.map(r => {
      const f = r.fields;

      let slug = (f.Slug || f.slug || "").toString().trim().toLowerCase();

      if (!slug && f.Titolo) {
        slug = f.Titolo
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      if (!slug && f.LinkPayhip) {
        const match = f.LinkPayhip.match(/\/b\/([A-Za-z0-9]+)/);
        if (match) slug = match[1].toLowerCase();
      }

      if (!slug) slug = r.id.toLowerCase();

      const product = {
        id: r.id,
        slug,
        ...f
      };

      if (!oldSlugs.includes(product.slug)) {
        console.log(`🟢 [UPDATE] Nuovo prodotto aggiunto al sito:
     • Nome prodotto: ${product.Titolo}`);
      }

      return product;
    });

    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(records, null, 2));

    console.log("🟢 [DEBUG] syncAirtable completato. Prodotti salvati:", records.length);

    return records;

  } catch (err) {
    console.error("❌ [DEBUG] Errore syncAirtable:", err);
    return safeReadJSON(PRODUCTS_PATH);
  }
}

/* ============================== EXPORT ============================== */
module.exports = {
  syncAirtable,
  loadProducts: () => safeReadJSON(PRODUCTS_PATH),
  getProducts: () => safeReadJSON(PRODUCTS_PATH)
};
