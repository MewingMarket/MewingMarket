// =========================================================
// File: app/server/routes/api-reset.cjs
// Reset password admin (Airtable master)
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("airtable").default;

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const TABLE = "Admin";

// Hash SHA256 (compatibile con tuo schema)
function hashPassword(pwd) {
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
// POST /admin/reset-password
// =========================================================
router.post("/admin/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    // 1) Cerca admin in Airtable
    const records = await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Admin non trovato" });
    }

    const admin = records[0];

    // 2) Aggiorna password
    await base(TABLE).update(admin.id, {
      PasswordHash: hashPassword(password),
      UltimoReset: new Date().toISOString()
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore reset admin:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
