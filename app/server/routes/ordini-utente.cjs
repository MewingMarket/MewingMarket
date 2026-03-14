/**
 * =========================================================
 * File: app/server/routes/ordini-utente.cjs
 * Restituisce gli ordini dell'utente loggato (SQL)
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

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

    // Recupera ordini dell'utente
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

    // Formatto per frontend
    const ordini = rows.map(o => ({
      id: o.id,
      utente_id: o.utente_id,
      prodotti: safeParse(o.prodotti_json),
      totale: o.totale_cent / 100,
      totale_cent: o.totale_cent,
      data: o.data_ordine,
      stato: o.stato,
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
