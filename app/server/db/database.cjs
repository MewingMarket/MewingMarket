const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Path persistente su Render Disk
const dbPath = "/var/data/mewingmarket.db";

// Inizializza DB
const db = new Database(dbPath);

// Path assoluto allo schema SQL dentro il progetto
const schemaPath = path.join(__dirname, "utenti.sql");

// Se il DB è nuovo (file appena creato), crea la tabella
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
  console.log("📌 Schema utenti creato o già esistente.");
} else {
  console.log("⚠️ File utenti.sql NON trovato:", schemaPath);
}

module.exports = db;
