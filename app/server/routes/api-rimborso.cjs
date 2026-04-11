/**
 * =========================================================
 * RIMBORSO — Crea richiesta
 * Versione 2026.950 — require assoluti + FIX sicurezza + FIX ordine
 * =========================================================
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authUser = R("middleware/auth-user.cjs");
const { inviaEmailRimborso } = R("modules/email-rimborso.cjs");
const jsonGen = R("modules/generatore-json.cjs");

const router = express.Router();

/**
 * Helper sicuro
 */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/**
 * =========================================================
 * POST /api/rimborso/crea
 * Protetto da auth-user
 * =========================================================
 */
router.post("/crea", authUser, async (req, res) => {
  const userId = req.user.id;
  const { ordine_id, motivo } = req.body;

  if (!ordine_id || !motivo) {
    return res.json({ success: false, error: "Campi mancanti." });
  }

  try {
    // 1) Recupera ordine dell’utente
    const stmt = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `);

    const ordine = stmt.get(ordine_id, userId);

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

    // 3) Determina tipo richiesta
    let tipo = "non_risolvibile";
    let guida = "";

    if (motivo.toLowerCase().includes("download")) {
      tipo = "risolvibile";
      guida = "Prova a scaricare il file da un altro browser o dispositivo.";
    }

    // 4) Invia email (Brevo o sandbox fallback)
    const stmtUser = db.prepare(`
      SELECT email FROM utenti WHERE id = ? LIMIT 1
    `);

    const utente = stmtUser.get(userId);

    await inviaEmailRimborso({
      email: utente.email,
      tipo,
      guida
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
