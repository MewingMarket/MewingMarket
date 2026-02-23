/**
 * =========================================================
 * File: app/server/startup/create-users-table.cjs
 * Crea la tabella "Utenti" in Airtable se non esiste
 * =========================================================
 */

const Airtable = require("airtable");

module.exports = async function ensureUsersTable() {
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE;

  if (!PAT || !BASE) {
    console.log("⚠️ Airtable non configurato, skip tabella Utenti");
    return;
  }

  const base = new Airtable({ apiKey: PAT }).base(BASE);

  try {
    // Tentiamo di leggere la tabella
    await base("Utenti").select({ maxRecords: 1 }).firstPage();
    console.log("ℹ️ Tabella 'Utenti' già esistente");
    return;
  } catch (err) {
    console.log("🆕 Creazione tabella 'Utenti'…");

    // Airtable non permette di creare tabelle via API.
    // Quindi creiamo un record "dummy" e Airtable crea la tabella automaticamente.
    try {
      await base("Utenti").create({
        email: "placeholder@example.com",
        password_hash: "placeholder",
        nome: "Placeholder",
        avatar_url: "",
        created_at: new Date().toISOString()
      });

      console.log("✅ Tabella 'Utenti' creata automaticamente");
    } catch (err2) {
      console.error("❌ Errore creazione tabella Utenti:", err2);
    }
  }
};
