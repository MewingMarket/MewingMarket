// =========================================================
// File: app/server/routes/api-paypal-cancel.cjs
// Annulla ordine PayPal + aggiorna Airtable
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
// GET /api/paypal/cancel-order?orderId=xxxx
// =========================================================
router.get("/paypal/cancel-order", async (req, res) => {
  try {
    const airtableId = req.query.orderId;

    if (!airtableId) {
      return res.json({ success: false, error: "OrderId mancante" });
    }

    // 1) RECUPERA ORDINE
    let record;
    try {
      record = await base(TABLE).find(airtableId);
    } catch {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    const stato = safeGet(record, "stato");

    // Se già completato → non lo tocchiamo
    if (stato === "completato" || stato === "COMPLETED") {
      return res.json({
        success: true,
        message: "Ordine già completato, nessuna modifica"
      });
    }

    // Se già annullato → non lo tocchiamo
    if (stato === "annullato" || stato === "CANCELLED") {
      return res.json({
        success: true,
        message: "Ordine già annullato"
      });
    }

    // 2) AGGIORNA STATO → ANNULLATO
    await base(TABLE).update(airtableId, {
      stato: "annullato",
      data: new Date().toISOString()
    });

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
