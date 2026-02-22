// =========================================================
// File: app/server/services/airtable.cjs
// Wrapper Airtable unificato (solo PAT)
// =========================================================

const Airtable = require("airtable");

const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;

if (!PAT || !BASE) {
  console.error("❌ ERRORE: Variabili Airtable mancanti (AIRTABLE_PAT, AIRTABLE_BASE)");
  process.exit(1);
}

const base = new Airtable({ apiKey: PAT }).base(BASE);

module.exports.airtable = (tableName) => base(tableName);
