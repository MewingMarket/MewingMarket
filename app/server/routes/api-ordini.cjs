// =========================================================
// File: app/server/routes/api-ordini.cjs
// Lista ordini (Admin) — Model A
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const Airtable = require("../lib/airtable-wrapper.cjs");

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
// GET — LISTA ORDINI (ADMIN)
// =========================================================
router.get("/ordini/lista", async (req, res) => {
  try {
    const records = await base(TABLE).select().all();

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
        metodo_pagamento: safeGet(r, "metodo_pagamento") || null,
        paypal_transaction_id: safeGet(r, "paypal_transaction_id") || null
      };
    });

    return res.json({ success: true, ordini });

  } catch (err) {
    console.error("❌ Errore /ordini/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
