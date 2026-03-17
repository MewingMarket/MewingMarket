/**
 * =========================================================
 * GENERATORE JSON — Mirror del database SQL
 * Crea i file statici in /app/public/data/
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

// PATCH: catalogo si trova in app/modules/
const catalogo = require("../../modules/catalogo-sql.cjs");

// db è già nella posizione corretta
const db = require("../db/database.cjs");

// Directory output JSON
const DATA_DIR = path.join(__dirname, "../../public/data");

// Assicura che la cartella esista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("📁 Creata cartella data:", DATA_DIR);
}

// ---------------------------------------------------------
// Helper: salva JSON
// ---------------------------------------------------------
function saveJSON(filename, data) {
  const full = path.join(DATA_DIR, filename);
  fs.writeFileSync(full, JSON.stringify(data, null, 2), "utf8");
  console.log("💾 JSON aggiornato:", filename);
}

// ---------------------------------------------------------
// 1) Prodotti
// ---------------------------------------------------------
async function exportProducts() {
  const prodotti = await catalogo.getAllProducts();
  saveJSON("products.json", prodotti);
}

// ---------------------------------------------------------
// 2) Categorie
// ---------------------------------------------------------
async function exportCategories() {
  const categorie = await catalogo.getAllCategories();
  saveJSON("categories.json", categorie);
}

// ---------------------------------------------------------
// 3) YouTube cache
// ---------------------------------------------------------
async function exportYouTube() {
  const rows = db.prepare("SELECT * FROM youtube_cache").all();
  saveJSON("youtube.json", rows);
}

// ---------------------------------------------------------
// 4) Ordini
// ---------------------------------------------------------
async function exportOrders() {
  const rows = db.prepare("SELECT * FROM ordini ORDER BY id DESC").all();
  saveJSON("orders.json", rows);
}

// ---------------------------------------------------------
// 5) Vendite
// ---------------------------------------------------------
async function exportSales() {
  const rows = db.prepare("SELECT * FROM vendite ORDER BY id DESC").all();
  saveJSON("sales.json", rows);
}

// ---------------------------------------------------------
// 6) Utenti
// ---------------------------------------------------------
async function exportUsers() {
  const rows = db.prepare("SELECT id, email, created_at FROM utenti").all();
  saveJSON("users.json", rows);
}

// ---------------------------------------------------------
// 7) Catalogo completo (prodotti + youtube + categorie)
// ---------------------------------------------------------
async function exportCatalog() {
  const prodotti = await catalogo.getAllProducts();
  const categorie = await catalogo.getAllCategories();
  const youtube = db.prepare("SELECT * FROM youtube_cache").all();

  const catalogoCompleto = {
    prodotti,
    categorie,
    youtube
  };

  saveJSON("catalog.json", catalogoCompleto);
}

// ---------------------------------------------------------
// 8) Esporta tutto
// ---------------------------------------------------------
async function exportAll() {
  await exportProducts();
  await exportCategories();
  await exportYouTube();
  await exportOrders();
  await exportSales();
  await exportUsers();
  await exportCatalog();
  console.log("✅ Tutti i JSON rigenerati");
}

module.exports = {
  exportProducts,
  exportCategories,
  exportYouTube,
  exportOrders,
  exportSales,
  exportUsers,
  exportCatalog,
  exportAll
};
