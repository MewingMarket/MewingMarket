// =========================================================
// Admin — Gestione Utenti
// =========================================================

const express = require("express");
const router = express.Router();
const db = require("../../db.cjs");
const { requireAdmin } = require("../../middleware/require-admin.cjs");

/* =========================================================
   LISTA UTENTI
========================================================= */
router.get("/lista", requireAdmin, async (req, res) => {
  try {
    const utenti = await db.all(`
      SELECT 
        email,
        newsletter,
        logged_in,
        bloccato
      FROM utenti
      ORDER BY email ASC
    `);

    res.json({ success: true, utenti });

  } catch (err) {
    console.error("Errore lista utenti:", err);
    res.json({ success: false, error: "Errore server." });
  }
});

/* =========================================================
   BLOCCA / SBLOCCA UTENTE
========================================================= */
router.post("/blocco", requireAdmin, async (req, res) => {
  const { email, bloccato } = req.body;

  if (!email) return res.json({ success: false, error: "Email mancante." });

  try {
    await db.run(
      `UPDATE utenti SET bloccato = ? WHERE email = ?`,
      [bloccato ? 1 : 0, email]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Errore blocco utente:", err);
    res.json({ success: false, error: "Errore server." });
  }
});

module.exports = router;
