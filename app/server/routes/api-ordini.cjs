// =========================================================
// File: app/server/routes/api-ordini.cjs
// Lista ordini (Admin) — Model A
// =========================================================

const express = require("express");
const router = express.Router();
const Airtable = require("airtable");

// Config Airtable
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;
const TABLE = "Ordini"; // <-- Nome tabella corretto

const base = new Airtable({ apiKey: PAT }).base(BASE);

// =========================================================
// GET — LISTA ORDINI (ADMIN)
// =========================================================
router.get("/ordini/lista", async (req, res) => {
  try {
    const records = await base(TABLE).select().all();

    const ordini = records.map(r => {
      let prodotti = [];

      try {
        prodotti = JSON.parse(r.get("prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      return {
        id: r.id,
        id_ordine: r.get("id_ordine") || null,
        utente: r.get("utente") || null,
        prodotti,
        totale: r.get("totale") || 0,
        data: r.get("data") || null,
        stato: r.get("stato") || "sconosciuto",
        metodo_pagamento: r.get("metodo_pagamento") || null,
        paypal_transaction_id: r.get("paypal_transaction_id") || null
      };
    });

    return res.json({ success: true, ordini });

  } catch (err) {
    console.error("❌ Errore /ordini/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
