/* =========================================================
   File: app/server/routes/admin-feedback.cjs
   Lista completa feedback per Admin — Versione definitiva PATCH A+B
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

router.get("/feedback/lista", (req, res) => {
  try {
    // 1) Query base
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

    // Carichiamo tutti gli ordini (per fallback)
    const ordini = db.prepare(`
      SELECT id, utente_id, prodotti_json
      FROM ordini
    `).all();

    const output = lista.map(f => {
      let email = f.utente_email;

      // 1) Se email esiste → ok
      if (email) {
        return { ...f, utente_email: email };
      }

      // 2) Fallback ordini (JSON)
      for (const o of ordini) {
        try {
          const prodotti = JSON.parse(o.prodotti_json);
          if (Array.isArray(prodotti)) {
            const match = prodotti.find(p => p.prodotto_id === f.prodotto_id);
            if (match) {
              const u = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(o.utente_id);
              if (u && u.email) {
                return { ...f, utente_email: u.email };
              }
            }
          }
        } catch {}
      }

      // 3) Fallback finale
      return { ...f, utente_email: "Anonimo" };
    });

    return res.json({ success: true, feedback: output });

  } catch (err) {
    console.error("❌ Errore /admin/feedback/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
