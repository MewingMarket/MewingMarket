/**
 * =========================================================
 * File: app/server/routes/paypal-create.cjs
 * Crea ordine PayPal (SQL) + salva ordine in DB
 * =========================================================
 */

const express = require("express");
const fetch = require("node-fetch");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

/**
 * =========================================================
 * POST /api/paypal/create-order
 * Protetto da auth-user
 * =========================================================
 */
router.post("/paypal/create-order", authUser, async (req, res) => {
  try {
    const { email, prodotti, totale } = req.body || {};

    if (!email || !Array.isArray(prodotti) || prodotti.length === 0) {
      return res.json({ success: false, error: "Dati ordine mancanti" });
    }

    // MODEL A → prendiamo solo il primo prodotto
    const prodotto = prodotti[0];

    const totaleCent = Number(totale || prodotto.prezzo_cent || 0);
    const totaleEuro = (totaleCent / 100).toFixed(2);

    // =========================================================
    // 1) CREA ORDINE NEL DB (stato: in_attesa_pagamento)
    // =========================================================
    const stmtInsert = db.prepare(`
      INSERT INTO ordini (
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        data_ordine
      ) VALUES (?, ?, ?, 'in_attesa_pagamento', 'PayPal', CURRENT_TIMESTAMP)
    `);

    const result = stmtInsert.run(
      req.user.id,
      JSON.stringify(prodotti),
      totaleCent
    );

    const ordineId = result.lastInsertRowid;

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
              reference_id: String(ordineId),
              amount: {
                currency_code: "EUR",
                value: totaleEuro
              }
            }
          ],
          application_context: {
            return_url: `${process.env.SITE_URL}/thankyou.html?orderId=${ordineId}`,
            cancel_url: `${process.env.SITE_URL}/cancel.html?orderId=${ordineId}`
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

    const paypalTransactionId = paypalData.id;

    // =========================================================
    // 3) SALVA TRANSACTION ID PAYPAL NEL DB
    // =========================================================
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET paypal_transaction_id = ?
      WHERE id = ?
    `);

    stmtUpdate.run(paypalTransactionId, ordineId);

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
