// =========================================================
// File: app/modules/user-auth.cjs
// Gestione utenti + sessione (Airtable)
// =========================================================

const Airtable = require("airtable");

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Utenti";

// Trova utente per email
async function findUserByEmail(email) {
  const records = await base(TABLE)
    .select({
      filterByFormula: `{Email} = "${email}"`
    })
    .firstPage();

  if (!records || records.length === 0) return null;

  const r = records[0];

  return {
    id: r.id,
    email: r.get("Email"),
    passwordHash: r.get("PasswordHash"),
    sessionToken: r.get("SessionToken"),
    sessionExpires: r.get("SessionExpires")
  };
}

// Crea nuovo utente
async function createUser({ email, passwordHash }) {
  const record = await base(TABLE).create({
    Email: email,
    PasswordHash: passwordHash,
    DataRegistrazione: new Date().toISOString()
  });

  return {
    id: record.id,
    email: record.get("Email")
  };
}

// Aggiorna campi utente
async function updateUser(id, fields) {
  return await base(TABLE).update(id, fields);
}

// Genera token sessione
function generateSessionToken() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2) +
    "-" +
    Math.random().toString(36).substring(2)
  );
}

module.exports = {
  findUserByEmail,
  createUser,
  updateUser,
  generateSessionToken
};
