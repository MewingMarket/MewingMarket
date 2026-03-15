/**
 * =========================================================
 * File: app/server/db/database.cjs
 * Database SQLite persistente su Render Disk
 * Carica automaticamente tutti gli schema .sql
 * =========================================================
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// =========================================================
// PATH PERSISTENTE SU RENDER DISK
// =========================================================
const dbPath = "/var/data/mewingmarket.db";

// Crea directory se non esiste
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log("📁 Creata directory persistente:", dir);
}

// =========================================================
// INIZIALIZZA DATABASE
// =========================================================
let db;
try {
  db = new Database(dbPath);
  console.log("🗄️ Database inizializzato:", dbPath);
} catch (err) {
  console.error("❌ ERRORE apertura DB:", err.message);
  throw err;
}

// =========================================================
// CARICA AUTOMATICAMENTE TUTTI GLI SCHEMA .SQL
// =========================================================
const schemaDir = __dirname;

let files = [];
try {
  files = fs.readdirSync(schemaDir).filter(f => f.endsWith(".sql"));
  console.log("📦 Schema trovati:", files);
} catch (err) {
  console.error("❌ ERRORE lettura directory schema:", err.message);
}

files.forEach(file => {
  const full = path.join(schemaDir, file);
  try {
    const sql = fs.readFileSync(full, "utf8");
    db.exec(sql);
    console.log("✅ Schema caricato:", file);
  } catch (err) {
    console.error("❌ Errore caricando schema", file, err.message);
  }
});

// =========================================================
// ESPORTA IL DB
// =========================================================
module.exports = db;
