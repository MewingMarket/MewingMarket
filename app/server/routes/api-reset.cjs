const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { airtable } = require("../services/airtable");

// Hash password
function hashPassword(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

router.post("/admin/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    // Cerca admin in Airtable
    const records = await airtable("Admin")
      .select({ filterByFormula: `{Email} = "${email}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Admin non trovato" });
    }

    const admin = records[0];

    // Aggiorna password
    await airtable("Admin").update(admin.id, {
      PasswordHash: hashPassword(password),
      UltimoReset: new Date().toISOString()
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Errore reset admin:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
