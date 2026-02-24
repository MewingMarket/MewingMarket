// =========================================================
// File: app/server/routes/api-paypal-complete.cjs
// Completa ordine PayPal + aggiorna Airtable + email
// =========================================================

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const Airtable = require("airtable").default;
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const { inviaEmailAcquisto } = require("../modules/email-acquisto.cjs");

const TABLE = "Ordini";

// =========================================================
// GET /api/paypal/complete-order?orderId=xxxx
// =========================================================
router.get("/paypal/complete-order", async (req, res) => {
  try {
    const airtableId = req.query.orderId;

    if (!airtableId) {
      return res.json({ success: false, error: "OrderId mancante" });
    }

    // 1) RECUPERA ORDINE
    const record = await base(TABLE).find(airtableId);

    if (!record) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    const paypalId = record.get("paypal_transaction_id");

    if (!paypalId) {
      return res.json({ success: false, error: "Transazione PayPal mancante" });
    }

    // 2) CATTURA PAGAMENTO PAYPAL
    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${paypalId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
          ).toString("base64")}`
        }
      }
    );

    const captureData = await captureRes.json();

    if (!captureData || !captureData.status) {
      return res.json({
        success: false,
        error: "Errore cattura PayPal"
      });
    }

    // 3) AGGIORNA ORDINE IN AIRTABLE
    await base(TABLE).update(airtableId, {
      stato: "completato",
      paypal_capture_id: captureData.id || "",
      data: new Date().toISOString()
    });

    // 4) PREPARA ORDINE PER IL FRONTEND
    let prodotti = [];
    try {
      prodotti = JSON.parse(record.get("prodotti") || "[]");
    } catch {}

    const ordine = {
      id: airtableId,
      id_ordine: record.get("id_ordine"),
      utente: record.get("utente"),
      prodotti,
      totale: record.get("totale"),
      data: new Date().toISOString(),
      stato: "completato",
      metodo_pagamento: "PayPal"
    };

    // 5) INVIA EMAIL DI CONFERMA ORDINE
    try {
      await inviaEmailAcquisto({
        email: ordine.utente,
        ordine
      });
    } catch (err) {
      console.error("❌ Errore invio email ordine:", err);
    }

    // 6) RITORNA ORDINE AL FRONTEND
    return res.json({
      success: true,
      order: ordine
    });

  } catch (err) {
    console.error("❌ Errore complete-order:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
