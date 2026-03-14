/**
 * =========================================================
 * File: app/server/routes/ordini-admin.cjs
 * Lista ordini per Dashboard Admin (SQL)
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/admin/ordini
 * Richiede ruolo admin
 * =========================================================
 */
router.get("/admin/ordini", authUser, (req, res) => {
  try {
    // Solo admin
    if (req.user?.ruolo !== "admin") {
      return res.json({ success: false, error: "Accesso negato" });
    }

    // Query ordini
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
      ORDER BY id DESC
    `);

    const rows = stmt.all();

    // Parsing prodotti_json
    const ordini = rows.map(o => ({
      ...o,
      prodotti: safeParse(o.prodotti_json),
      totale_euro: (o.totale_cent / 100).toFixed(2)
    }));

    return res.json({
      success: true,
      ordini
    });

  } catch (err) {
    console.error("❌ Errore /admin/ordini:", err);
    return res.json({ success: false, error: "Errore server" });
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
