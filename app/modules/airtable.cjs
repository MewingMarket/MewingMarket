/**
 * app/modules/airtable.cjs
 * Gestione catalogo prodotti + vendite (versione definitiva con PAT)
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "products.json");

// ⭐ READY FLAG — il bot risponde solo quando è true
global.catalogReady = false;

let PRODUCTS_CACHE = [];
let SALES_CACHE = {};

/* =========================================================
   SALVATAGGIO SU FILE
========================================================= */
function saveProductsToFile(products) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Errore salvataggio products.json:", err);
  }
}

/* =========================================================
   CARICAMENTO DA FILE
========================================================= */
function loadProducts() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, "utf8");
      PRODUCTS_CACHE = JSON.parse(raw);

      // Se abbiamo prodotti da file → catalogo pronto
      if (Array.isArray(PRODUCTS_CACHE) && PRODUCTS_CACHE.length > 0) {
        global.catalogReady = true;
        console.log("📦 Catalogo caricato da file (catalogReady = true)");
      }
    }
  } catch (err) {
    console.error("Errore loadProducts:", err);
  }
  return PRODUCTS_CACHE;
}

/* =========================================================
   GET PRODUCTS — blindato
========================================================= */
function getProducts() {
  return Array.isArray(PRODUCTS_CACHE) ? PRODUCTS_CACHE : [];
}

/* =========================================================
   SYNC AIRTABLE (VERSIONE DEFINITIVA)
========================================================= */
async function syncAirtable() {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;
    const TABLE = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE || !TABLE) {
      console.log("⏭️ Airtable sync skipped: missing PAT / BASE / TABLE_NAME");
      return false;
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);
    const tableName = decodeURIComponent(TABLE);

    const records = await base(tableName).select({}).all();

    const products = records.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        slug: f.Slug || f.slug || "",
        titolo: f.Titolo || f.title || "",
        titoloBreve: f.TitoloBreve || "",
        descrizione: f.Descrizione || f.description || "",
        descrizioneBreve: f.DescrizioneBreve || "",
        prezzo: f.Prezzo || f.price || 0,
        immagine: f.Immagine || f.image || [],
        linkPayhip: f.LinkPayhip || "",
        youtube_url: f.youtube_url || "",
        youtube_title: f.youtube_title || "",
        youtube_description: f.youtube_description || "",
        youtube_thumbnail: f.youtube_thumbnail || "",
        youtube_last_video_url: f.youtube_last_video_url || "",
        youtube_last_video_title: f.youtube_last_video_title || "",
        categoria: f.Categoria || ""
      };
    });

    PRODUCTS_CACHE = products;
    saveProductsToFile(products);

    // ⭐ READY FLAG → ora il bot può rispondere
    global.catalogReady = true;
    console.log("🟢 Airtable sync OK:", products.length, "prodotti (catalogReady = true)");

    return true;

  } catch (err) {
    console.error("❌ Errore syncAirtable:", err);
    return false;
  }
}

/* =========================================================
   SALVATAGGIO VENDITE
========================================================= */
async function saveSaleToAirtable(data) {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    if (!PAT || !BASE) {
      console.log("⏭️ saveSaleToAirtable skipped: missing PAT / BASE");
      return;
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);

    await base("Sales").create([
      {
        fields: {
          uid: data.uid,
          product: data.product,
          price: data.price,
          email: data.email,
        }
      }
    ]);

  } catch (err) {
    console.error("Errore saveSaleToAirtable:", err);
  }
}

/* =========================================================
   GET SALES
========================================================= */
async function getSalesByUID(uid) {
  try {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE = process.env.AIRTABLE_BASE;

    if (!PAT || !BASE) {
      console.log("⏭️ getSalesByUID skipped: missing PAT / BASE");
      return [];
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE);

    const records = await base("Sales").select({
      filterByFormula: `{uid} = "${uid}"`
    }).all();

    return records.map((r) => ({
      id: r.id,
      uid: r.get("uid"),
      product: r.get("product"),
      price: r.get("price"),
      email: r.get("email"),
      created: r.get("created"),
    }));

  } catch (err) {
    console.error("Errore getSalesByUID:", err);
    return [];
  }
}

module.exports = {
  loadProducts,
  getProducts,
  syncAirtable,
  saveSaleToAirtable,
  getSalesByUID
};
