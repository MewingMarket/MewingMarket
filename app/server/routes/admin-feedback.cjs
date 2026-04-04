/* =========================================================
   File: app/server/routes/admin-feedback.cjs
   Lista completa feedback per Admin — Versione definitiva PATCH
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
        p.titolo_breve AS prodotto_titolo,

        /* =====================================================
           1) Email diretta se utente_id esiste
           2) Altrimenti fallback da vendite
           3) Altrimenti fallback da ordini
           4) Altrimenti "Anonimo"
        ====================================================== */
        COALESCE(
          u.email,
          (SELECT u2.email 
             FROM vendite v2
             JOIN utenti u2 ON u2.id = v2.utente_id
            WHERE v2.prodotto_id = f.prodotto_id
            LIMIT 1),
          (SELECT u3.email 
             FROM ordini o3
             JOIN utenti u3 ON u3.id = o3.utente_id
            WHERE o3.prodotto_id = f.prodotto_id
            LIMIT 1),
          'Anonimo'
        ) AS utente_email

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
