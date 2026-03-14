/**
 * =========================================================
 * File: app/server/routes/paypal-cancel.cjs
 * Annulla ordine PayPal (SQL) + email annullamento
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const { inviaEmailOrdineAnnullato } = require("../modules/email-ordine-annullato.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/paypal/cancel-order?orderId=xxxx
 * =========================================================
 */
router.get("/paypal/cancel-order", (req, res) => {
  try {
    const orderId = req.query.orderId;

    if (!orderId) {
      return res.json({ success: false, error: "OrderId mancante" });
    }

    // Recupera ordine
    const stmtFind = db.prepare(`
      SELECT id, stato, utente_id, prodotti_json, totale_cent
      FROM ordini
      WHERE id = ?
    `);

    const ordine = stmtFind.get(orderId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // Se già completato → non lo tocchiamo
    if (ordine.stato === "completato" || ordine.stato === "COMPLETED") {
      return res.json({
        success: true,
        message: "Ordine già completato, nessuna modifica"
      });
    }

    // Se già annullato → non lo tocchiamo
    if (ordine.stato === "annullato" || ordine.stato === "CANCELLED") {
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

    stmtUpdate.run(orderId);

    // Recupera email utente
    const stmtUser = db.prepare(`
      SELECT email
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `);

    const utente = stmtUser.get(ordine.utente_id);
    const emailUtente = utente?.email || "";

    // Invia email annullamento
    try {
      inviaEmailOrdineAnnullato({
        email: emailUtente,
        ordine: {
          id: ordine.id,
          prodotti: JSON.parse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        }
      });
    } catch (err) {
      console.error("⚠️ Errore invio email annullamento:", err);
    }

    return res.json({
      success: true,
      message: "Ordine annullato correttamente"
    });

  } catch (err) {
    console.error("❌ Errore cancel-order:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
