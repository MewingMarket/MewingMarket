// =========================================================
// File: app/server/routes/api-ordini-utente.cjs
// Restituisce gli ordini dell'utente loggato
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const Airtable = require("../lib/airtable-wrapper.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

// =========================================================
// GET /api/ordini/utente
// Protetto da auth-user
// =========================================================
router.get("/ordini/utente", authUser, async (req, res) => {
  try {
    const email = req.user.email;

    // 1) CERCA ORDINI DELL'UTENTE
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

    // 2) FORMATTA ORDINI PER IL FRONTEND
    const ordini = records.map(r => {
      let prodotti = [];
      try {
        prodotti = JSON.parse(safeGet(r, "prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      return {
        id: r.id,
        id_ordine: safeGet(r, "id_ordine"),
        utente: safeGet(r, "utente"),
        prodotti,
        totale: Number(safeGet(r, "totale") || 0),
        data: safeGet(r, "data") || r._rawJson.createdTime,
        stato: safeGet(r, "stato") || "sconosciuto",
        metodo_pagamento: safeGet(r, "metodo_pagamento") || "paypal",
        paypal_transaction_id: safeGet(r, "paypal_transaction_id") || null
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
