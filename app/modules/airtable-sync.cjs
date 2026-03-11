/**
 * =========================================================
 * File: app/modules/airtable-sync.cjs
 * Versione CRON — Anti Timeout, Anti Catalogo Vuoto,
 * Nessuna dipendenza dal server, Nessuna sync multipla
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_PATH = path.join(DATA_DIR, "products.json");

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

  // Scrittura atomica: prima file temporaneo, poi rename
  const tempPath = DATA_PATH + ".tmp";

  fs.writeFileSync(tempPath, JSON.stringify(products, null, 2));
  fs.renameSync(tempPath, DATA_PATH);

  console.log("💾 products.json aggiornato (scrittura atomica)");
}

/* =========================================================
   SYNC AIRTABLE — VERSIONE CRON
   - Timeout sicuro
   - Mai sovrascrivere con 0 record
   - Nessuna dipendenza dal server
========================================================= */

async function syncAirtable() {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;
    const TABLE = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE || !TABLE) {
      console.log("⏭️ Sync Airtable saltata: variabili mancanti");
      return false;
    }

    console.log("📡 Sync Airtable (CRON)…");

    const base = new Airtable({ apiKey: PAT }).base(BASE);
    const tableName = decodeURIComponent(TABLE);

    console.log("🔍 DEBUG Airtable:");
    console.log("   BASE  =", BASE);
    console.log("   TABLE =", `"${tableName}"`);
    console.log("   PAT   =", PAT ? "OK" : "MISSING");

    console.log("🔎 Eseguo select().all()…");

    // Timeout di sicurezza
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve("TIMEOUT"), 8000)
    );

    const airtablePromise = base(tableName).select({}).all();

    const result = await Promise.race([airtablePromise, timeoutPromise]);

    if (result === "TIMEOUT") {
      console.log("⏭️ Sync Airtable annullata: TIMEOUT");
      return false;
    }

    const records = result;

    console.log("🔎 Query completata, records:", records.length);

    if (!records.length) {
      console.log("⏭️ Sync Airtable annullata: 0 record");
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

    saveProductsToFile(products);

    console.log("🟢 Sync Airtable COMPLETATA:", products.length, "prodotti");

    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);
    return false;
  }
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  syncAirtable
};
