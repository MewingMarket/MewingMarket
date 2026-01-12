// modules/airtable.js

const fs = require("fs");
const path = require("path");
require("dotenv").config();

let productsCache = [];

function loadProducts() {
  try {
    const filePath = path.join(process.cwd(), "data", "products.json");

    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ products.json non trovato. Creo file vuoto.");
      fs.writeFileSync(filePath, "[]");
    }

    const raw = fs.readFileSync(filePath, "utf8");
    productsCache = JSON.parse(raw || "[]");

    console.log(`📦 Prodotti caricati: ${productsCache.length}`);
  } catch (err) {
    console.error("❌ Errore caricamento products.json:", err);
    productsCache = [];
  }
}

function getProducts() {
  return productsCache;
}

async function syncAirtable() {
  console.log("🔄 Sync Airtable simulata (nessuna API attiva)");

  const filePath = path.join(process.cwd(), "data", "products.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const products = JSON.parse(raw || "[]");

  return products;
}

module.exports = {
  loadProducts,
  getProducts,
  syncAirtable
};
