/* =========================================================
   File: app/server/routes/api-recensioni-top.cjs
   Top recensioni globali — Versione definitiva PATCH ID
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

/* =========================================================
   GET /recensioni/top
   Restituisce le migliori recensioni globali
   Criteri:
   - rating >= 4
   - commento non vuoto
   - ordinate per data DESC
   - limite 10
   - PATCH: restituisce prodotto_id per link basato su ID
========================================================= */
router.get("/recensioni/top", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.prodotto_id,          -- PATCH: aggiunto ID prodotto
        f.rating,
        f.commento,
        f.data,
        p.titolo_breve AS prodotto_titolo
      FROM feedback f
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      WHERE f.rating >= 4
        AND LENGTH(f.commento) > 0
      ORDER BY f.id DESC
      LIMIT 10
    `);

    const top = stmt.all();

    return res.json({ success: true, top });

  } catch (err) {
    console.error("❌ Errore /recensioni/top:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
