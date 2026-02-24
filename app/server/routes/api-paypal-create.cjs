// =========================================================
// File: app/server/routes/api-paypal-create.cjs
// Crea ordine PayPal (solo utenti loggati) + Airtable
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const Airtable = require("airtable").default;
const fetch = require("node-fetch");
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
// POST /api/paypal/create-order
// Protetto da auth-user
// =========================================================
router.post("/paypal/create-order", authUser, async (req, res) => {
  try {
    const { email, prodotti, totale, mode } = req.body || {};

    if (!email || !Array.isArray(prodotti) || prodotti.length === 0) {
      return res.json({ success: false, error: "Dati ordine mancanti" });
    }

    // MODEL A → prendiamo solo il primo prodotto
    const prodotto = prodotti[0];

    // =========================================================
    // 1) CREA ORDINE IN AIRTABLE (stato: in_attesa_pagamento)
    // =========================================================
    const ordineId = Date.now(); // ID univoco locale

    const record = await base(TABLE).create({
      id_ordine: ordineId,
      utente: email,
      prodotti: JSON.stringify(prodotti),
      totale: Number(totale || prodotto.prezzo || 0),
      data: new Date().toISOString(),
      stato: "in_attesa_pagamento",
      metodo_pagamento: "PayPal"
    });

    const airtableId = record.id;

    // =========================================================
    // 2) CREA ORDINE PAYPAL (MODEL A)
    // =========================================================
    const paypalRes = await fetch(
      "https://api-m.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
          ).toString("base64")}`
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: airtableId,
              amount: {
                currency_code: "EUR",
                value: Number(totale || prodotto.prezzo || 0).toFixed(2)
              }
            }
          ],
          application_context: {
            return_url: `${process.env.SITE_URL}/thankyou.html?orderId=${airtableId}`,
            cancel_url: `${process.env.SITE_URL}/cancel.html?orderId=${airtableId}`
          }
        })
      }
    );

    const paypalData = await paypalRes.json().catch(() => null);

    if (!paypalData || !paypalData.id) {
      return res.json({
        success: false,
        error: "Errore PayPal"
      });
    }

    // =========================================================
    // 3) SALVA TRANSACTION ID PAYPAL IN AIRTABLE
    // =========================================================
    await base(TABLE).update(airtableId, {
      paypal_transaction_id: paypalData.id
    });

    // =========================================================
    // 4) TROVA LINK APPROVAL PAYPAL
    // =========================================================
    const approveLink = paypalData.links?.find(l => l.rel === "approve");

    if (!approveLink) {
      return res.json({
        success: false,
        error: "Nessun link PayPal trovato"
      });
    }

    return res.json({
      success: true,
      paypalUrl: approveLink.href
    });

  } catch (err) {
    console.error("❌ Errore create-order:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
