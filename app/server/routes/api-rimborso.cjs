/**
 * =========================================================
 * File: app/server/routes/api-rimborso.cjs
 * RIMBORSI — Utente + Admin (unificato)
 * Versione 2026.950 — require assoluti + FIX sicurezza + SQL ready
 * =========================================================
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authUser = R("middleware/auth-user.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

const { inviaEmailRimborso } = R("modules/email-rimborso.cjs");
const { inviaEmailRimborsoApprovato } = R("modules/email-rimborso-approvato.cjs");
const { inviaEmailRimborsoRifiutato } = R("modules/email-rimborso-rifiutato.cjs");

const jsonGen = R("modules/generatore-json.cjs");

const router = express.Router();

/* =========================================================
   Helper sicuro
========================================================= */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/* =========================================================
   UTENTE — CREA RICHIESTA RIMBORSO
   POST /api/rimborso/crea
========================================================= */
router.post("/crea", authUser, async (req, res) => {
  const userId = req.user.id;
  const { ordine_id, motivo } = req.body;

  if (!ordine_id || !motivo) {
    return res.json({ success: false, error: "Campi mancanti." });
  }

  try {
    // 1) Recupera ordine dell’utente
    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `).get(ordine_id, userId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato." });
    }

    // 2) Solo ordini completati possono essere rimborsati
    if (ordine.stato !== "completato") {
      return res.json({
        success: false,
        error: "Puoi richiedere rimborso solo per ordini completati."
      });
    }

    // 3) Inserisci richiesta rimborso
    db.prepare(`
      INSERT INTO rimborsi (ordine_id, utente_id, motivo, stato)
      VALUES (?, ?, ?, 'in_attesa')
    `).run(ordine_id, userId, motivo);

    // 4) Email utente
    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(userId);

    await inviaEmailRimborso({
      email: utente.email,
      tipo: "richiesta",
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
   POST /api/rimborso/procedi/:id
========================================================= */
router.post("/procedi/:id", authAdmin, async (req, res) => {
  const rimborsoId = req.params.id;

  try {
    // 1) Recupera richiesta rimborso
    const r = db.prepare(`
      SELECT *
      FROM rimborsi
      WHERE id = ?
      LIMIT 1
    `).get(rimborsoId);

    if (!r) {
      return res.json({ success: false, error: "Richiesta rimborso non trovata." });
    }

    // 2) Recupera ordine
    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ?
      LIMIT 1
    `).get(r.ordine_id);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato." });
    }

    // 3) Aggiorna ordine → rimborsato
    db.prepare(`
      UPDATE ordini
      SET stato = 'rimborsato',
          download_token = NULL,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordine.id);

    // 4) Aggiorna richiesta rimborso
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'approvato'
      WHERE id = ?
    `).run(rimborsoId);

    // 5) Aggiorna JSON mirror
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    // 6) Email utente
    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(r.utente_id);

    await inviaEmailRimborsoApprovato({
      email: utente.email,
      ordine_id: ordine.id
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore procedi rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

/* =========================================================
   ADMIN — RIFIUTA RIMBORSO
   POST /api/rimborso/rifiuta/:id
========================================================= */
router.post("/rifiuta/:id", authAdmin, async (req, res) => {
  const rimborsoId = req.params.id;

  try {
    const r = db.prepare(`
      SELECT *
      FROM rimborsi
      WHERE id = ?
      LIMIT 1
    `).get(rimborsoId);

    if (!r) {
      return res.json({ success: false, error: "Richiesta rimborso non trovata." });
    }

    // Aggiorna stato
    db.prepare(`
      UPDATE rimborsi
      SET stato = 'rifiutato'
      WHERE id = ?
    `).run(rimborsoId);

    // Email utente
    const utente = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(r.utente_id);

    await inviaEmailRimborsoRifiutato({
      email: utente.email,
      ordine_id: r.ordine_id
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore rifiuto rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
