/**
 * =========================================================
 * File: app/server/routes/paypal-cancel.cjs
 * Annulla ordine PayPal (SQL)
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");

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
      SELECT id, stato
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
