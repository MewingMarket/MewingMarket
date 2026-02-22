// =========================================================
// File: app/server/routes/api-paypal-cancel.cjs
// Annulla ordine PayPal + aggiorna Airtable
// =========================================================

const express = require("express");
const router = express.Router();

const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

// =========================================================
// GET /api/paypal/cancel-order?orderId=xxxx
// =========================================================
router.get("/paypal/cancel-order", async (req, res) => {
  try {
    const airtableId = req.query.orderId;

    if (!airtableId) {
      return res.json({ success: false, error: "OrderId mancante" });
    }

    // =========================================================
    // 1) RECUPERA ORDINE
    // =========================================================
    let record;
    try {
      record = await base(TABLE).find(airtableId);
    } catch {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // Se già completato → non lo tocchiamo
    if (record.get("stato") === "completato") {
      return res.json({
        success: true,
        message: "Ordine già completato, nessuna modifica"
      });
    }

    // =========================================================
    // 2) AGGIORNA STATO → ANNULLATO
    // =========================================================
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
