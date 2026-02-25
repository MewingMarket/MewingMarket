// =========================================================
// File: app/server/routes/api-admin.cjs
// Sistema ADMIN definitivo (password in chiaro + ENV + Airtable)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("../lib/airtable-wrapper.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE
// ---------------------------------------------------------
Airtable.configure({ apiKey: process.env.AIRTABLE_PAT });
const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE_ADMIN = "Admin";

// ---------------------------------------------------------
// CONFIG ENV
// ---------------------------------------------------------
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ---------------------------------------------------------
// Helper token
// ---------------------------------------------------------
function genToken() {
  return "adm_" + crypto.randomBytes(16).toString("hex");
}

/* =========================================================
   LOGIN ADMIN
========================================================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.json({ success: false, error: "Credenziali non valide" });
  }

  const token = genToken();

  try {
    // Aggiorna Airtable (opzionale ma utile)
    const records = await base(TABLE_ADMIN)
      .select({ filterByFormula: `{Email} = '${email}'` })
      .firstPage();

    if (records.length > 0) {
      await base(TABLE_ADMIN).update(records[0].id, { Token: token });
    }

    return res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Errore login admin:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET ADMIN
========================================================= */
router.post("/reset", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.json({ success: false, error: "Email mancante" });
  }

  if (email !== ADMIN_EMAIL) {
    return res.json({ success: false, error: "Admin non trovato" });
  }

  try {
    const nuovaPassword = "ADM-" + Math.floor(Math.random() * 999999);
    const nuovoToken = genToken();

    // Aggiorna Airtable
    const records = await base(TABLE_ADMIN)
      .select({ filterByFormula: `{Email} = '${email}'` })
      .firstPage();

    if (records.length > 0) {
      await base(TABLE_ADMIN).update(records[0].id, {
        PasswordHash: nuovaPassword,
        Token: nuovoToken
      });
    }

    // NOTA IMPORTANTE:
    // Devi aggiornare manualmente ADMIN_PASSWORD su Render
    // con la nuova password generata.

    return res.json({
      success: true,
      nuovaPassword,
      messaggio: "Aggiorna ADMIN_PASSWORD su Render"
    });
  } catch (err) {
    console.error("❌ Errore reset admin:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
