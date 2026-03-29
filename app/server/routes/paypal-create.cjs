/**
 * =========================================================
 * File: app/server/routes/paypal-create.cjs
 * Crea ordine PayPal (SQL) + salva ordine in DB + JSON mirror
 * =========================================================
 */

const express = require("express");
const fetch = require("node-fetch");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");
const jsonGen = require("../modules/generatore-json.cjs");

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

    // totale arriva in EURO → convertiamo in centesimi
    const totaleCent = Math.round(Number(totale) * 100);
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

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    // =========================================================
    // 2) CREA ORDINE PAYPAL — PATCH COMPLETA (SANDBOX + LIVE)
    // =========================================================

    const MODE = process.env.PAYPAL_MODE || "sandbox";

    const PAYPAL_API = MODE === "sandbox"
      ? process.env.PAYPAL_SANDBOX_API
      : process.env.PAYPAL_LIVE_API;

    const CLIENT_ID = MODE === "sandbox"
      ? process.env.PAYPAL_SANDBOX_CLIENT_ID
      : process.env.PAYPAL_LIVE_CLIENT_ID;

    const SECRET = MODE === "sandbox"
      ? process.env.PAYPAL_SANDBOX_SECRET
      : process.env.PAYPAL_LIVE_SECRET;

    const paypalRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            CLIENT_ID + ":" + SECRET
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

    // =========================================================
    // 🔥 PATCH: LOG RAW PAYPAL RESPONSE
    // =========================================================
    const raw = await paypalRes.text();
    console.log("PAYPAL RAW RESPONSE:", raw);

    let paypalData = null;
    try {
      paypalData = JSON.parse(raw);
    } catch (err) {
      console.log("PAYPAL JSON PARSE ERROR:", err);
    }

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

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

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
