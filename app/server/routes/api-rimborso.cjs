/**
 * =========================================================
 * RIMBORSI — Utente + Admin (unificato)
 * Versione 2026.960 — Rimborso intelligente
 * =========================================================
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

const { inviaEmailRimborso } = R("modules/email-rimborso.cjs");
const jsonGen = R("modules/generatore-json.cjs");

const router = express.Router();

/* =========================================================
   UTENTE — CREA RICHIESTA RIMBORSO (INTELLIGENTE)
========================================================= */
router.post("/crea", authUser, async (req, res) => {
  const userId = req.user.id;
  const { ordine_id, motivo } = req.body;

  if (!ordine_id || !motivo) {
    return res.json({ success: false, error: "Campi mancanti." });
  }

  try {
    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `).get(ordine_id, userId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato." });
    }

    if (ordine.stato !== "completato") {
      return res.json({
        success: false,
        error: "Puoi richiedere rimborso solo per ordini completati."
      });
    }

    // =========================================================
    // 🔥 LOGICA INTELLIGENTE
    // =========================================================
    const motivoLower = motivo.toLowerCase();

    const paroleRisolvibili = [
      "download",
      "scaricare",
      "non si apre",
      "file",
      "errore",
      "link"
    ];

    const isRisolvibile = paroleRisolvibili.some(k => motivoLower.includes(k));

    // =========================================================
    // CASO 1 — RISOLVIBILE → email aiuto → NON crea rimborso
    // =========================================================
    if (isRisolvibile) {
      await inviaEmailRimborso({
        email: req.user.email,
        tipo: "risolvibile",
        guida: "Prova a scaricare il file da un altro browser o dispositivo. Se il problema persiste, rispondi a questa email."
      });

      return res.json({
        success: true,
        message: "Problema risolvibile → email inviata → rimborso NON aperto"
      });
    }

    // =========================================================
    // CASO 2 — NON RISOLVIBILE → crea richiesta rimborso
    // =========================================================
    db.prepare(`
      INSERT INTO rimborsi (ordine_id, utente_id, motivo, stato)
      VALUES (?, ?, ?, 'in_attesa')
    `).run(ordine_id, userId, motivo);

    await inviaEmailRimborso({
      email: req.user.email,
      tipo: "non_risolvibile",
      guida: ""
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

/* =========================================================
   ADMIN — APPROVA RIMBORSO
========================================================= */
router.post("/procedi/:id", authAdmin, async (req, res) => {
  const rimborsoId = req.params.id;

  try {
    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return res.json({ success: false, error: "Richiesta non trovata." });

    const ordine = db.prepare(`SELECT * FROM ordini WHERE id = ?`).get(r.ordine_id);
    if (!ordine) return res.json({ success: false, error: "Ordine non trovato." });

    db.prepare(`
      UPDATE ordini
      SET stato = 'rimborsato',
          download_token = NULL,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordine.id);

    db.prepare(`
      UPDATE rimborsi
      SET stato = 'approvato'
      WHERE id = ?
    `).run(rimborsoId);

    try { await jsonGen.exportOrders(); } catch {}

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore procedi rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

/* =========================================================
   ADMIN — RIFIUTA RIMBORSO
========================================================= */
router.post("/rifiuta/:id", authAdmin, async (req, res) => {
  const rimborsoId = req.params.id;

  try {
    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return res.json({ success: false, error: "Richiesta non trovata." });

    db.prepare(`
      UPDATE rimborsi
      SET stato = 'rifiutato'
      WHERE id = ?
    `).run(rimborsoId);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore rifiuto rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
