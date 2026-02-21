// =========================================================
// File: app/server/routes/api-login.cjs
// Login utenti + admin (Airtable master)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { airtable } = require("../services/airtable");

function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

// LOGIN UTENTE
router.post("/utente/login", async (req, res) => {
  const { email, password } = req.body;

  const records = await airtable("Utenti")
    .select({ filterByFormula: `{Email} = "${email}"` })
    .firstPage();

  if (records.length === 0)
    return res.json({ success: false, error: "Utente non trovato" });

  const user = records[0];

  if (user.get("PasswordHash") !== hash(password))
    return res.json({ success: false, error: "Password errata" });

  return res.json({
    success: true,
    token: "tok_" + crypto.randomBytes(16).toString("hex")
  });
});

// LOGIN ADMIN
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  const records = await airtable("Admin")
    .select({ filterByFormula: `{Email} = "${email}"` })
    .firstPage();

  if (records.length === 0)
    return res.json({ success: false, error: "Admin non trovato" });

  const admin = records[0];

  if (admin.get("PasswordHash") !== hash(password))
    return res.json({ success: false, error: "Password errata" });

  return res.json({
    success: true,
    token: "adm_" + crypto.randomBytes(16).toString("hex")
  });
});

module.exports = router;
