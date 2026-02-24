// =========================================================
// Airtable Wrapper — compatibilità universale
// =========================================================

const Airtable = require("airtable");

// Simula la sintassi moderna .configure()
Airtable.configure = function (opts) {
  Airtable._apiKey = opts.apiKey;
  Airtable._baseId = opts.baseId || process.env.AIRTABLE_BASE;
};

// Simula la sintassi moderna .base()
Airtable.base = function (baseId) {
  return new Airtable({ apiKey: Airtable._apiKey }).base(baseId);
};

module.exports = Airtable;
