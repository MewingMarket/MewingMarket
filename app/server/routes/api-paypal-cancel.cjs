// =========================================================
// File: app/server/routes/api-paypal-cancel.cjs
// Annulla ordine PayPal + aggiorna Airtable
// =========================================================

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { updateOrder, getAllOrders } = require("../../modules/ordini.cjs");

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = "https://api-m.paypal.com";

// =========================================================
// GET /api/paypal/cancel-order
// =========================================================
router.get("/paypal/cancel-order", async (req, res) => {
  const orderId = req.query.orderId;

  if (!orderId) {
    return res.json({ success: false, error: "Order ID mancante" });
  }

  try {
    // 1) OTTIENI TOKEN PAYPAL
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2) TROVA ORDINE IN AIRTABLE
    const ordini = await getAllOrders();
    const ordine = ordini.find(o => o.paypal_transaction_id === orderId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // 3) SE L’ORDINE È ANCORA "in_attesa_pagamento" → annulla
    await updateOrder(ordine.id, {
      stato: "annullato"
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore cancel-order:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
