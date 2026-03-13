const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve("app/server/db/mewingmarket.db");
const db = new Database(dbPath);

// Carica lo schema utenti
const fs = require("fs");
const schema = fs.readFileSync(path.resolve("app/server/db/utenti.sql"), "utf8");
db.exec(schema);

module.exports = db;
