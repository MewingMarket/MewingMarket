/**
 * app/modules/airtable.cjs
 * Gestione catalogo prodotti + vendite (versione resiliente)
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "products.json");

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
    }
  } catch (err) {
    console.error("Errore loadProducts:", err);
  }
  return PRODUCTS_CACHE;
}

function getProducts() {
  return PRODUCTS_CACHE;
}

/* =========================================================
   SYNC AIRTABLE (RESILIENTE)
========================================================= */
async function syncAirtable() {
  try {
    // PATCH: Airtable non deve partire senza API key
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE) {
      console.log("⏭️ Airtable sync skipped: missing API key or base");
      return false;
    }

    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE);

    const records = await base("Products").select({}).all();

    const products = records.map((r) => ({
      id: r.id,
      slug: r.get("slug"),
      title: r.get("title"),
      description: r.get("description"),
      price: r.get("price"),
      image: r.get("image"),
    }));

    PRODUCTS_CACHE = products;
    saveProductsToFile(products);

    return true;

  } catch (err) {
    console.error("Errore syncAirtable:", err);
    return false;
  }
}

/* =========================================================
   SALVATAGGIO VENDITE
========================================================= */
async function saveSaleToAirtable(data) {
  try {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE) {
      console.log("⏭️ saveSaleToAirtable skipped: missing API key");
      return;
    }

    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE);

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
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE) {
      console.log("⏭️ getSalesByUID skipped: missing API key");
      return [];
    }

    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE);

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
