// =========================================================
// File: app/server/routes/api-paypal-create.cjs
// CREA ORDINE PAYPAL + CREA ORDINE IN AIRTABLE
// =========================================================

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { createOrder } = require("../../modules/ordini.cjs");

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = "https://api-m.paypal.com";

// =========================================================
// POST /api/paypal/create-order
// =========================================================
router.post("/paypal/create-order", async (req, res) => {
  const { email, prodotti, totale, mode } = req.body;

  if (!email || !prodotti || prodotti.length === 0) {
    return res.json({ success: false, error: "Dati ordine mancanti" });
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

    // 2) CREA ORDINE PAYPAL
    const ppOrderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: totale.toFixed(2)
            }
          }
        ],
        application_context: {
          brand_name: "MewingMarket",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: "https://mewingmarket.it/thankyou.html?orderId={order_id}",
          cancel_url: "https://mewingmarket.it/cancel.html"
        }
      })
    });

    const ppOrder = await ppOrderRes.json();

    if (!ppOrder.id) {
      return res.json({ success: false, error: "Errore creazione ordine PayPal" });
    }

    const paypalOrderId = ppOrder.id;

    // 3) CREA ORDINE IN AIRTABLE
    const ordineCreato = await createOrder({
      utente: email,
      prodotti: JSON.stringify(prodotti),
      totale: totale,
      stato: "in_attesa_pagamento",
      paypal_transaction_id: paypalOrderId,
      mode
    });

    // 4) OTTIENI LINK PAYPAL
    const approveLink = ppOrder.links.find(l => l.rel === "approve");

    if (!approveLink) {
      return res.json({ success: false, error: "Link PayPal non trovato" });
    }

    // 5) RISPONDI AL CHECKOUT
    return res.json({
      success: true,
      paypalUrl: approveLink.href,
      orderId: paypalOrderId,
      airtableId: ordineCreato.id
    });

  } catch (err) {
    console.error("❌ Errore create-order:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
