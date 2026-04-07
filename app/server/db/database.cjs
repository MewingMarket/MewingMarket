/**
 * =========================================================
 * File: app/server/db/database.cjs
 * Database SQLite persistente su Render Disk
 * Compatibile con ambiente locale / Codespaces
 * Carica automaticamente tutti gli schema .sql
 * =========================================================
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// =========================================================
// PATH DB DINAMICO (Render vs Locale)
// =========================================================
//
// Render → /var/data/mewingmarket.db  (persistente)
// Locale / Codespaces → ./data/mewingmarket.db (scrivibile)
//
// Render espone variabili d'ambiente come:
// - RENDER=true
// - RENDER_SERVICE_ID=xxxx
//
const isRender =
  process.env.RENDER === "true" ||
  Boolean(process.env.RENDER_SERVICE_ID);

const dbPath = isRender
  ? "/var/data/mewingmarket.db"
  : path.join(process.cwd(), "data", "mewingmarket.db");

// =========================================================
// CREA DIRECTORY SE NON ESISTE
// =========================================================
const dir = path.dirname(dbPath);

try {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Creata directory DB:", dir);
  }
} catch (err) {
  console.error("❌ ERRORE creazione directory DB:", err.message);
  throw err;
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
