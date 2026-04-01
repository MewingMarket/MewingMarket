/* =========================================================
   File: app/server/routes/admin-feedback.cjs
   Lista completa feedback per Admin — Versione definitiva
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

router.get("/feedback/lista", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.rating,
        f.commento,
        f.data,
        u.email AS utente_email,
        p.titolo_breve AS prodotto_titolo,
        p.slug AS prodotto_slug
      FROM feedback f
      LEFT JOIN utenti u ON u.id = f.utente_id
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      ORDER BY f.id DESC
    `);

    const lista = stmt.all();

    return res.json({ success: true, feedback: lista });

  } catch (err) {
    console.error("❌ Errore /admin/feedback/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
