// =========================================================
// File: app/server/routes/api-ordini-utente.cjs
// Restituisce gli ordini dell'utente loggato
// =========================================================

const express = require("express");
const router = express.Router();

const authUser = require("../middleware/auth-user.cjs");

const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

// =========================================================
// GET /api/ordini/utente
// Protetto da auth-user
// =========================================================
router.get("/ordini/utente", authUser, async (req, res) => {
  try {
    const email = req.user.email; // da auth-user

    // =========================================================
    // 1) CERCA ORDINI DELL'UTENTE
    // =========================================================
    const records = await base(TABLE)
      .select({
        filterByFormula: `{utente} = "${email}"`,
        sort: [{ field: "data", direction: "desc" }]
      })
      .all();

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        ordini: []
      });
    }

    // =========================================================
    // 2) FORMATTA ORDINI PER IL FRONTEND
    // =========================================================
    const ordini = records.map(r => {
      let prodotti = [];
      try {
        prodotti = JSON.parse(r.get("prodotti") || "[]");
      } catch {}

      return {
        id: r.id,
        id_ordine: r.get("id_ordine"),
        utente: r.get("utente"),
        prodotti,
        totale: r.get("totale"),
        data: r.get("data"),
        stato: r.get("stato"),
        metodo_pagamento: r.get("metodo_pagamento"),
        paypal_transaction_id: r.get("paypal_transaction_id") || null
      };
    });

    return res.json({
      success: true,
      ordini
    });

  } catch (err) {
    console.error("❌ Errore ordini utente:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
