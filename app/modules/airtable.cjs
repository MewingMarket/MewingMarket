/* ============================== IMPORT ============================== */
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
function getExistingSlugs() {
  try {
    const file = fs.readFileSync(path.join(__dirname, "../../public/products.json"), "utf8");
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

    /* ============================================================
       PATCH SLUG — Garantisce che ogni prodotto abbia SEMPRE uno slug valido
    ============================================================ */
    const records = data.records.map(r => {
      const f = r.fields;

      // 1) Normalizza slug da Airtable (Slug o slug)
      let slug = (f.Slug || f.slug || "").toString().trim().toLowerCase();

      // 2) Se slug è vuoto → prova a generarlo dal titolo
      if (!slug && f.Titolo) {
        slug = f.Titolo
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      // 3) Se ancora vuoto → prova dal link Payhip
      if (!slug && f.LinkPayhip) {
        const match = f.LinkPayhip.match(/\/b\/([A-Za-z0-9]+)/);
        if (match) slug = match[1].toLowerCase();
      }

      // 4) Se ancora vuoto → fallback ID Airtable
      if (!slug) slug = r.id.toLowerCase();

      // ⭐ QUI CREIAMO IL PRODUCT (identico al tuo codice)
      const product = {
        id: r.id,
        slug,   // <-- SEMPRE presente, SEMPRE minuscolo
        ...f
      };

      // ⭐ PATCH: LOG NUOVO PRODOTTO (UNICA AGGIUNTA)
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

/* Salva vendita (versione normalizzata) */
async function saveSaleToAirtable(fields) {
  console.log("💰 [DEBUG] saveSaleToAirtable → POST (normalizzato)");

  // Normalizzazione totale
  const normalized = {
    UID: fields.UID || "auto_" + Date.now(),

    // Prodotto
    Prodotto: fields.Prodotto || fields.slug || fields.product_id || "sconosciuto",

    // Prezzo
    Prezzo: Number(fields.Prezzo || fields.price || 0),

    // Origine
    Origine: fields.Origine || fields.source || "Sconosciuta",

    // UTM
    UTMSource: fields.UTMSource || fields.utm_source || "",
    UTMMedium: fields.UTMMedium || fields.utm_medium || "",
    UTMCampaign: fields.UTMCampaign || fields.utm_campaign || "",

    // Referrer e pagine
    Referrer: fields.Referrer || fields.referrer || "",
    PaginaIngresso: fields.PaginaIngresso || fields.entry_page || "",
    PaginaUscita: fields.PaginaUscita || fields.exit_page || "",

    // Bot
    UltimoIntent: fields.UltimoIntent || fields.intent || "",
    UltimoMessaggio: fields.UltimoMessaggio || fields.message || "",

    // Device e lingua
    Device: fields.Device || fields.device || "unknown",
    Lingua: fields.Lingua || fields.lang || "unknown",

    // Timestamp
    Timestamp: fields.Timestamp || fields.timestamp || new Date().toISOString()
  };

  const url = `https://api.airtable.com/v0/${BASE_ID}/Vendite`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields: normalized })
  });

  const data = await res.json();

  if (data.error) {
    console.error("❌ [DEBUG] Errore saveSaleToAirtable:", data.error);
  } else {
    console.log("🟢 [DEBUG] Vendita salvata su Airtable:", normalized);
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
