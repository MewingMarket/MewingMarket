/**
 * =========================================================
 * File: app/server/routes/ordini-admin.cjs
 * Lista ordini per Dashboard Admin (DB LIVE)
 * Versione 2026.97 — SQL READY + KPI + prodotti_json
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

    // 1) Recupera tutti gli ordini
    const stmt = db.prepare(`
      SELECT 
        id,
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        data_ordine
      FROM ordini
      ORDER BY data_ordine DESC
    `);

    const ordini = stmt.all();

    // 2) KPI
    const totali = ordini.length;
    const completati = ordini.filter(o => o.stato === "completato").length;
    const annullati = ordini.filter(o => o.stato === "annullato").length;

    // 3) Parsing prodotti_json
    const parsed = ordini.map(o => ({
      ...o,
      prodotti: safeParse(o.prodotti_json)
    }));

    return res.json({
      success: true,
      stats: {
        totali,
        completati,
        abbandonati: annullati
      },
      ordini: parsed
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
