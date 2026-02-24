-// =========================================================
// File: app/server/routes/api-registrazione.cjs
// Registrazione utenti (Airtable master)
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("../lib/airtable-wrapper.cjs");
const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const TABLE = "Utenti";

// Hash SHA256 (compatibile con tuo schema)
function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

// =========================================================
// POST /utente/register
// =========================================================
router.post("/utente/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    // 1) Controlla se esiste già
    const existing = await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (existing.length > 0) {
      return res.json({ success: false, error: "Email già registrata" });
    }

    // 2) Crea utente
    await base(TABLE).create({
      Email: email,
      PasswordHash: hash(password),
      DataRegistrazione: new Date().toISOString(),
      UltimoAccesso: ""
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
