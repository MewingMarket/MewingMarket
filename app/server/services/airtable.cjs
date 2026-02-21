// =========================================================
// File: app/server/services/airtable.cjs
// Wrapper Airtable universale per tutte le API
// =========================================================

const Airtable = require("airtable");

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

module.exports.airtable = (table) => base(table);
