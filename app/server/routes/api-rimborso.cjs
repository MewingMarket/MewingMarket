/**
 * =========================================================
 * RIMBORSI — Utente + Admin (unificato)
 * Versione 2026.995 — Rimborso intelligente premium
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

// Nuovi moduli autorizzati
const categorieRimborso = R("modules/rimborso-categorie.cjs");
const { generaRispostaRimborso } = R("modules/genera-risposta-rimborso.cjs");

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
    // 🔥 RICONOSCIMENTO CATEGORIA
    // =========================================================
    const motivoLower = motivo.toLowerCase();

    let categoriaRecord =
      categorieRimborso.find(c =>
        c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
      ) ||
      categorieRimborso.find(c => c.categoria === "altro");

    const tipo = categoriaRecord.tipo;

    // =========================================================
    // CASO 1 — RISOLVIBILE → email categoria → NON crea ticket
    // =========================================================
    if (tipo === "risolvibile") {
      await inviaEmailRimborso({
        email: req.user.email,
        tipo: "risolvibile",
        motivo,
        categoriaRecord
      });

      return res.json({
        success: true,
        message: "Problema risolvibile → email inviata → rimborso NON aperto"
      });
    }

    // =========================================================
    // CASO 2 — NON RISOLVIBILE → crea ticket
    // =========================================================
    db.prepare(`
      INSERT INTO rimborsi (ordine_id, utente_id, motivo, stato)
      VALUES (?, ?, ?, 'in_attesa')
    `).run(ordine_id, userId, motivo);

    await inviaEmailRimborso({
      email: req.user.email,
      tipo: "non_risolvibile",
      motivo,
      categoriaRecord
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

/* =========================================================
   ADMIN — APPROVA RIMBORSO (stato = 1)
========================================================= */
router.post("/procedi/:id", authAdmin, async (req, res) => {
  const rimborsoId = req.params.id;

  try {
    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return res.json({ success: false, error: "Richiesta non trovata." });

    const ordine = db.prepare(`SELECT * FROM ordini WHERE id = ?`).get(r.ordine_id);
    if (!ordine) return res.json({ success: false, error: "Ordine non trovato." });

    // Aggiorna ordine
    db.prepare(`
      UPDATE ordini
      SET stato = 'rimborsato',
          download_token = NULL,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordine.id);

    // Aggiorna rimborso
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'approvato'
      WHERE id = ?
    `).run(rimborsoId);

    // Email approvazione
    await inviaEmailRimborso({
      email: ordine.email,
      tipo: "approvato",
      motivo: r.motivo,
      categoriaRecord: null
    });

    try { await jsonGen.exportOrders(); } catch {}

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore procedi rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

/* =========================================================
   ADMIN — RIFIUTA RIMBORSO (stato = 2)
========================================================= */
router.post("/rifiuta/:id", authAdmin, async (req, res) => {
  const rimborsoId = req.params.id;

  try {
    const r = db.prepare(`SELECT * FROM rimborsi WHERE id = ?`).get(rimborsoId);
    if (!r) return res.json({ success: false, error: "Richiesta non trovata." });

    // Riconoscimento categoria per risposta rifiuto
    const motivoLower = r.motivo.toLowerCase();

    let categoriaRecord =
      categorieRimborso.find(c =>
        c.keywords.some(k => motivoLower.includes(k.toLowerCase()))
      ) ||
      categorieRimborso.find(c => c.categoria === "altro");

    // Aggiorna stato
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'rifiutato'
      WHERE id = ?
    `).run(rimborsoId);

    // Email rifiuto
    await inviaEmailRimborso({
      email: r.email,
      tipo: "rifiutato",
      motivo: r.motivo,
      categoriaRecord
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore rifiuto rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
