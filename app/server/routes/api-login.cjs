// =========================================================
// File: app/server/routes/api-login.cjs
// Login utenti + admin (Airtable master)
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

// Tabelle
const TABLE_UTENTI = "Utenti";
const TABLE_ADMIN = "Admin";

// Hash SHA256 (compatibile con tuo schema)
function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

/* =========================================================
   LOGIN UTENTE — /utente/login
========================================================= */
router.post("/utente/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const records = await base(TABLE_UTENTI)
      .select({
        filterByFormula: `{Email} = "${email}"`
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    if (user.get("PasswordHash") !== hash(password)) {
      return res.json({ success: false, error: "Password errata" });
    }

    // Token semplice (compatibile con tuo sistema)
    const token = "tok_" + crypto.randomBytes(16).toString("hex");

    return res.json({ success: true, token });

  } catch (err) {
    console.error("❌ Errore login utente:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   LOGIN ADMIN — /admin/login
========================================================= */
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const records = await base(TABLE_ADMIN)
      .select({
        filterByFormula: `{Email} = "${email}"`
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Admin non trovato" });
    }

    const admin = records[0];

    if (admin.get("PasswordHash") !== hash(password)) {
      return res.json({ success: false, error: "Password errata" });
    }

    const token = "adm_" + crypto.randomBytes(16).toString("hex");

    return res.json({ success: true, token });

  } catch (err) {
    console.error("❌ Errore login admin:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
