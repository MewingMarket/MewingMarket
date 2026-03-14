const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Path persistente su Render Disk
const dbPath = "/var/data/mewingmarket.db";

// Inizializza DB
const db = new Database(dbPath);

// Directory dove tieni TUTTI gli schema SQL
const schemaDir = __dirname;

// Carica automaticamente TUTTI i file .sql presenti nella cartella
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith(".sql"));

console.log("📦 Schema trovati:", files);

files.forEach(file => {
  const full = path.join(schemaDir, file);
  try {
    const sql = fs.readFileSync(full, "utf8");
    db.exec(sql);
    console.log("✅ Schema caricato:", file);
  } catch (err) {
    console.error("❌ Errore caricando schema", file, err);
  }
});

module.exports = db;
