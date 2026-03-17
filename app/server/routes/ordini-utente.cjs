/**
 * =========================================================
 * File: app/server/routes/ordini-utente.cjs
 * Restituisce gli ordini dell'utente loggato (SQL)
 * + Annulla ordine (SQL) + JSON mirror ordini
 * Compatibile con /public/ordini.js
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");
const { inviaEmailOrdineAnnullato } = require("../modules/email-ordine-annullato.cjs");
const jsonGen = require(".../modules/generatore-json.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/ordini/utente
 * Protetto da auth-user
 * =========================================================
 */
router.get("/ordini/utente", authUser, (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.json({
        success: false,
        error: "Utente non valido"
      });
    }

    const stmt = db.prepare(`
      SELECT 
        id,
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        paypal_transaction_id,
        data_ordine
      FROM ordini
      WHERE utente_id = ?
      ORDER BY id DESC
    `);

    const rows = stmt.all(userId);

    const ordini = rows.map(o => ({
      id: o.id,
      prodotti: safeParse(o.prodotti_json),
      totale: o.totale_cent / 100,
      stato: o.stato,
      data: o.data_ordine,
      metodo_pagamento: o.metodo_pagamento,
      paypal_transaction_id: o.paypal_transaction_id
    }));

    return res.json({
      success: true,
      ordini
    });

  } catch (err) {
    console.error("❌ Errore /ordini/utente:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

/**
 * =========================================================
 * POST /api/ordini/annulla/:id
 * Protetto da auth-user
 * =========================================================
 */
router.post("/ordini/annulla/:id", authUser, async (req, res) => {
  try {
    const ordineId = req.params.id;
    const userId = req.user.id;

    if (!ordineId || !userId) {
      return res.json({
        success: false,
        error: "Dati mancanti"
      });
    }

    // Recupera ordine
    const stmtFind = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ?
      LIMIT 1
    `);

    const ordine = stmtFind.get(ordineId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // Verifica appartenenza
    if (ordine.utente_id !== userId) {
      return res.json({
        success: false,
        error: "Non puoi annullare un ordine non tuo"
      });
    }

    // Se già completato → non si può annullare
    if (ordine.stato === "completato") {
      return res.json({
        success: false,
        error: "Ordine già completato, non annullabile"
      });
    }

    // Se già annullato → ok
    if (ordine.stato === "annullato") {
      return res.json({
        success: true,
        message: "Ordine già annullato"
      });
    }

    // Aggiorna stato → annullato
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET stato = 'annullato',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmtUpdate.run(ordineId);

    // Recupera email utente
    const stmtUser = db.prepare(`
      SELECT email
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `);

    const utente = stmtUser.get(userId);
    const emailUtente = utente?.email || "";

    // Invia email annullamento
    try {
      inviaEmailOrdineAnnullato({
        email: emailUtente,
        ordine: {
          id: ordine.id,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        }
      });
    } catch (err) {
      console.error("⚠️ Errore invio email annullamento:", err);
    }

    // 🔥 Aggiorna JSON mirror ordini (per admin)
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    return res.json({
      success: true,
      message: "Ordine annullato correttamente"
    });

  } catch (err) {
    console.error("❌ Errore annulla ordine:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

/**
 * Helper sicuro per JSON
 */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

module.exports = router;
