/* =========================================================
   File: app/server/routes/admin-feedback.cjs
   Lista completa feedback per Admin — Versione definitiva PATCH A+B
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

router.get("/feedback/lista", (req, res) => {
  try {
    // 1) Query base SENZA subquery (robusta)
    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.rating,
        f.commento,
        f.data,
        f.prodotto_id,
        f.utente_id,
        p.titolo_breve AS prodotto_titolo,
        u.email AS utente_email
      FROM feedback f
      LEFT JOIN utenti u ON u.id = f.utente_id
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      ORDER BY f.id DESC
    `);

    const lista = stmt.all();

    // 2) Fallback JS: se utente_email è NULL → risali da vendite/ordini
    const fallbackVendite = db.prepare(`
      SELECT u.email
      FROM vendite v
      JOIN utenti u ON u.id = v.utente_id
      WHERE v.prodotto_id = ?
      LIMIT 1
    `);

    const fallbackOrdini = db.prepare(`
      SELECT u.email
      FROM ordini o
      JOIN utenti u ON u.id = o.utente_id
      WHERE o.prodotto_id = ?
      LIMIT 1
    `);

    const output = lista.map(f => {
      let email = f.utente_email;

      // Se non c'è email → fallback vendite
      if (!email) {
        const r1 = fallbackVendite.get(f.prodotto_id);
        if (r1 && r1.email) email = r1.email;
      }

      // Se ancora nulla → fallback ordini
      if (!email) {
        const r2 = fallbackOrdini.get(f.prodotto_id);
        if (r2 && r2.email) email = r2.email;
      }

      // Se ancora nulla → Anonimo
      if (!email) email = "Anonimo";

      return {
        ...f,
        utente_email: email
      };
    });

    return res.json({ success: true, feedback: output });

  } catch (err) {
    console.error("❌ Errore /admin/feedback/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
