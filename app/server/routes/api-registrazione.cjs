// =========================================================
// File: app/server/routes/api-registrazione.cjs
// Registrazione utenti (Airtable master)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { airtable } = require("../services/airtable");

// Hash password
function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

// REGISTRAZIONE UTENTE
router.post("/utente/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.json({ success: false, error: "Dati mancanti" });

    // Controlla se esiste già
    const existing = await airtable("Utenti")
      .select({ filterByFormula: `{Email} = "${email}"` })
      .firstPage();

    if (existing.length > 0)
      return res.json({ success: false, error: "Email già registrata" });

    // Crea utente
    await airtable("Utenti").create({
      Email: email,
      PasswordHash: hash(password),
      DataRegistrazione: new Date().toISOString(),
      UltimoAccesso: ""
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Errore registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
