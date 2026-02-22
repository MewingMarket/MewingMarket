// =========================================================
// File: app/server/routes/api-paypal-complete.cjs
// Conferma pagamento PayPal + email + Airtable
// =========================================================

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { sendOrderEmail } = require("../modules/email.cjs");
const { updateOrder, getAllOrders } = require("../modules/ordini.cjs");

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = "https://api-m.paypal.com";

// =========================================================
// GET /api/paypal/complete-order
// =========================================================
router.get("/paypal/complete-order", async (req, res) => {
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

    // 2) VERIFICA ORDINE PAYPAL
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const orderData = await orderRes.json();

    if (orderData.status !== "COMPLETED") {
      return res.json({ success: false, error: "Pagamento non completato" });
    }

    // 3) TROVA ORDINE IN AIRTABLE
    const ordini = await getAllOrders();
    const ordine = ordini.find(o => o.paypal_transaction_id === orderId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // 4) AGGIORNA STATO ORDINE
    await updateOrder(ordine.id, {
      stato: "completato"
    });

    // 5) INVIA EMAIL DI RINGRAZIAMENTO
    await sendOrderEmail({
      email: ordine.utente,
      ordine
    });

    // 6) RISPONDI ALLA THANKYOU PAGE
    return res.json({
      success: true,
      order: ordine
    });

  } catch (err) {
    console.error("❌ Errore complete-order:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
