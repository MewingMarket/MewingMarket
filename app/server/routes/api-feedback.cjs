/**
 * =========================================================
 * File: app/server/routes/api-feedback.cjs
 * Sistema recensioni utenti — Versione SQL definitiva (PATCH 2026.3002)
 * Versione 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authUser = R("middleware/auth-user.cjs");
const { inviaEmailFeedback } = R("modules/email-feedback.cjs");

const router = express.Router();

/* =========================================================
   GET /api/recensioni/prodotti-acquistati
========================================================= */
router.get("/recensioni/prodotti-acquistati", authUser, (req, res) => {
  try {
    const userId = req.user.id;

    console.log("🔍 [DEBUG] /prodotti-acquistati → userId:", userId);

    const stmt = db.prepare(`
      SELECT DISTINCT p.id, p.titolo_breve
      FROM ordini o,
           json_each(o.prodotti_json) AS je
      JOIN prodotti p
           ON p.id = CAST(json_extract(je.value, '$.prodotto_id') AS INTEGER)
      WHERE o.utente_id = ?
    `);

    const prodotti = stmt.all(userId);

    console.log("🔍 [DEBUG] Prodotti trovati:", prodotti);

    return res.json({ success: true, prodotti });

  } catch (err) {
    console.error("❌ Errore GET /recensioni/prodotti-acquistati:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   GET /api/recensioni/utente
========================================================= */
router.get("/recensioni/utente", authUser, (req, res) => {
  try {
    const userId = req.user.id;

    console.log("🔍 [DEBUG] /recensioni/utente → userId:", userId);

    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.prodotto_id,
        f.rating,
        f.commento,
        f.data,
        p.titolo_breve AS prodotto_titolo
      FROM feedback f
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      WHERE f.utente_id = ?
      ORDER BY f.id DESC
    `);

    const recensioni = stmt.all(userId);

    console.log("🔍 [DEBUG] Recensioni trovate:", recensioni);

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
    const userEmail = req.user.email;
    const { prodotto_id, rating, commento } = req.body;

    console.log("📝 [DEBUG] CREA RECENSIONE →", {
      userId,
      prodotto_id,
      rating,
      commento
    });

    if (!prodotto_id || !rating || !commento) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const paroleVietate = [
      "cazzo", "merda", "stronzo", "troia", "puttana", "vaffanculo",
      "bastardo", "cretino", "deficiente", "idiota"
    ];

    const lower = commento.toLowerCase();
    if (paroleVietate.some(p => lower.includes(p))) {
      return res.json({
        success: false,
        error: "Linguaggio non consentito"
      });
    }

    /* ------------------------------
       VERIFICA ACQUISTO
    ------------------------------ */
    const stmtOrdini = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE utente_id = ?
    `);

    const ordini = stmtOrdini.all(userId);

    console.log("🔍 [DEBUG] Ordini utente:", ordini);

    let haAcquistato = false;

    for (const o of ordini) {
      const prodotti = safeParse(o.prodotti_json);
      console.log("🔍 [DEBUG] Prodotti ordine:", prodotti);

      if (prodotti.some(p => Number(p.prodotto_id) === Number(prodotto_id))) {
        haAcquistato = true;
        break;
      }
    }

    console.log("🔍 [DEBUG] Ha acquistato?", haAcquistato);

    if (!haAcquistato) {
      return res.json({
        success: false,
        error: "Non hai acquistato questo prodotto"
      });
    }

    /* ------------------------------
       BLOCCO DOPPIE RECENSIONI
    ------------------------------ */
    const stmtCheck = db.prepare(`
      SELECT id FROM feedback
      WHERE utente_id = ? AND prodotto_id = ?
    `);

    const esiste = stmtCheck.get(userId, prodotto_id);

    console.log("🔍 [DEBUG] Recensione già esistente?", esiste);

    if (esiste) {
      return res.json({
        success: false,
        error: "Hai già recensito questo prodotto"
      });
    }

    /* ------------------------------
       INSERIMENTO RECENSIONE
    ------------------------------ */
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

    console.log("✅ [DEBUG] Recensione inserita");

    /* =========================================================
       PATCH — INVIO EMAIL FEEDBACK (non blocca la risposta)
    ========================================================= */
    try {
      console.log("📨 [DEBUG] Invio email ringraziamento feedback →", userEmail);

      inviaEmailFeedback({
        email: userEmail,
        prodotto_id,
        rating,
        commento
      });

    } catch (err) {
      console.error("❌ [DEBUG] Errore invio email feedback:", err);
    }

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

/* =========================================================
   POST /api/recensioni/elimina
========================================================= */
router.post("/recensioni/elimina", authUser, (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;

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

    db.prepare(`DELETE FROM feedback WHERE id = ?`).run(id);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore POST /recensioni/elimina:", err);
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
