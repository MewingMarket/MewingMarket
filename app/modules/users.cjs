// =========================================================
// File: app/modules/users.cjs
// Gestione utenti tramite Airtable
// =========================================================

const Airtable = require("airtable");

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Utenti";

async function findUserByEmail(email) {
  const records = await base(TABLE)
    .select({ filterByFormula: `{email} = '${email}'`, maxRecords: 1 })
    .all();
  return records[0] || null;
}

async function updateUserPassword(id, newPass) {
  await base(TABLE).update(id, { password_hash: newPass });
}

module.exports = { findUserByEmail, updateUserPassword };
