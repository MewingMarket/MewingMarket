// =========================================================
// File: app/server/routes/api-ordini.cjs
// Lista ordini (Admin) — Versione SQL definitiva
// =========================================================

const express = require("express");
const router = express.Router();

const db = require("../../db/database.cjs");

// =========================================================
// GET — LISTA ORDINI (ADMIN)
// =========================================================
router.get("/ordini/lista", async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        o.*,
        u.email AS utente_email
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      ORDER BY o.id DESC
    `).all();

    const ordini = rows.map(r => ({
      id: r.id,
      id_ordine: r.id, // compatibilità con vecchia UI
      utente: r.utente_email,
      prodotti: JSON.parse(r.prodotti_json || "[]"),
      totale: r.totale_cent / 100,
      data: r.data_ordine,
      stato: r.stato,
      metodo_pagamento: r.metodo_pagamento,
      paypal_transaction_id: r.paypal_transaction_id
    }));

    return res.json({ success: true, ordini });

  } catch (err) {
    console.error("❌ Errore /ordini/lista (SQL):", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
