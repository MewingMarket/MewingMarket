/**
 * =========================================================
 * GENERATORE JSON — Mirror del database SQL
 * Persistente su /var/data/json + copia in /app/public/data
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

// Catalogo SQL
const catalogo = require("../../modules/catalogo-sql.cjs");
const db = require("../db/database.cjs");

// ---------------------------------------------------------
// Percorsi
// ---------------------------------------------------------

// 1) Persistente (Render Disk)
const DISK_DIR = "/var/data/json";

// 2) Copia per il frontend (volatile)
const PUBLIC_DIR = path.join(__dirname, "../../public/data");

// Crea entrambe le cartelle se mancano
[DISK_DIR, PUBLIC_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Creata cartella:", dir);
  }
});

// ---------------------------------------------------------
// Helper: salva JSON in persistente + copia nel public
// ---------------------------------------------------------
function saveJSON(filename, data) {
  const json = JSON.stringify(data, null, 2);

  // Persistente
  fs.writeFileSync(path.join(DISK_DIR, filename), json, "utf8");

  // Copia volatile per il frontend
  fs.writeFileSync(path.join(PUBLIC_DIR, filename), json, "utf8");

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
// 7) Catalogo completo
// ---------------------------------------------------------
async function exportCatalog() {
  const prodotti = await catalogo.getAllProducts();
  const categorie = await catalogo.getAllCategories();
  const youtube = db.prepare("SELECT * FROM youtube_cache").all();

  const catalogoCompleto = { prodotti, categorie, youtube };
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

  console.log("✅ Tutti i JSON rigenerati (persistente + public)");
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
