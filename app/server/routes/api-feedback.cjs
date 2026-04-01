/**
 * =========================================================
 * File: app/server/routes/api-feedback.cjs
 * Sistema recensioni utenti — Versione SQL definitiva
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

/* =========================================================
   GET /api/recensioni/utente
========================================================= */
router.get("/recensioni/utente", authUser, (req, res) => {
  try {
    const userId = req.user.id;

    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.prodotto_id,
        f.rating,
        f.commento,
        f.data,
        p.slug AS prodotto_slug,
        p.titolo_breve AS prodotto_titolo
      FROM feedback f
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      WHERE f.utente_id = ?
      ORDER BY f.id DESC
    `);

    const recensioni = stmt.all(userId);

    return res.json({ success: true, recensioni });

  } catch (err) {
    console.error("❌ Errore GET /recensioni/utente:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   POST /api/recensioni/crea
========================================================= */
router.post("/recensioni/crea", authUser, (req, res) => {
  try {
    const userId = req.user.id;
    const { prodotto_id, rating, commento } = req.body;

    if (!prodotto_id || !rating || !commento) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const stmtOrdini = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE utente_id = ?
    `);

    const ordini = stmtOrdini.all(userId);

    let haAcquistato = false;

    for (const o of ordini) {
      const prodotti = safeParse(o.prodotti_json);
      if (prodotti.some(p => p.prodotto_id === prodotto_id)) {
        haAcquistato = true;
        break;
      }
    }

    if (!haAcquistato) {
      return res.json({
        success: false,
        error: "Non hai acquistato questo prodotto"
      });
    }

    const stmtInsert = db.prepare(`
      INSERT INTO feedback (
        utente_id,
        prodotto_id,
        rating,
        commento,
        data
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmtInsert.run(userId, prodotto_id, Number(rating), commento);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore POST /recensioni/crea:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   POST /api/recensioni/modifica
========================================================= */
router.post("/recensioni/modifica", authUser, (req, res) => {
  try {
    const userId = req.user.id;
    const { id, rating, commento } = req.body;

    if (!id || !rating || !commento) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const stmtFind = db.prepare(`
      SELECT utente_id
      FROM feedback
      WHERE id = ?
    `);

    const rec = stmtFind.get(id);

    if (!rec) {
      return res.json({ success: false, error: "Recensione non trovata" });
    }

    if (rec.utente_id !== userId) {
      return res.json({ success: false, error: "Non autorizzato" });
    }

    const stmtUpdate = db.prepare(`
      UPDATE feedback
      SET rating = ?, commento = ?, data = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmtUpdate.run(Number(rating), commento, id);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore POST /recensioni/modifica:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

module.exports = router;
