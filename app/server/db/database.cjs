const Database = require("better-sqlite3");
const fs = require("fs");

// Path persistente su Render Disk
const dbPath = "/var/data/mewingmarket.db";

// Inizializza DB
const db = new Database(dbPath);

// Carica schema utenti se il DB è nuovo
const schemaPath = "/project/src/app/server/db/utenti.sql";
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
}

module.exports = db;
