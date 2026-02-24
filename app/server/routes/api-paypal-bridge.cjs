// =========================================================
// File: app/server/routes/api-paypal-bridge.cjs
// Bridge PayPal legacy → nuovo PayPal Model A
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const Airtable = require("airtable").default;

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const TABLE_ORDINI = "Ordini";

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------
// Helper: registra ordine legacy in Airtable
// ---------------------------------------------------------
async function registraOrdineAirtable({ email, prodotti, totale, mode, paypalOrderId }) {
  try {
    const prodottiJSON = JSON.stringify(prodotti || []);

    await base(TABLE_ORDINI).create({
      utente: email || "",
      prodotti: prodottiJSON,
      totale: Number(totale || 0),
      stato: "in_attesa",
      metodo_pagamento: "paypal",
      id_ordine: paypalOrderId || "",
      data: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Errore registrazione ordine Airtable:", err);
  }
}

// =========================================================
// 1) CREATE ORDER (legacy) → /api/paypal/create-order
//    Usato da: checkout.js (vecchio frontend premium)
// =========================================================
router.post("/paypal/create-order", async (req, res) => {
  try {
    const { email, prodotti, totale, mode } = req.body || {};

    if (!email || !Array.isArray(prodotti) || prodotti.length === 0) {
      return res.json({ success: false, error: "Dati ordine mancanti" });
    }

    // MODEL A → prendiamo solo il primo prodotto
    const prodotto = prodotti[0];

    const fetch = (await import("node-fetch")).default;

    // Chiama il nuovo endpoint PayPal Model A
    const resPaypal = await fetch(
      `${process.env.BASE_URL || "http://localhost:3000"}/api/paypal/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          slug: prodotto.slug,
          prezzo: Number(prodotto.prezzo || totale || 0)
        })
      }
    );

    const data = await resPaypal.json().catch(() => null);

    if (!data || !data.success || !data.approvalUrl) {
      console.error("❌ Errore create PayPal:", data);
      return res.json({ success: false, error: "Errore creazione ordine PayPal" });
    }

    // Registra ordine legacy in Airtable
    await registraOrdineAirtable({
      email,
      prodotti,
      totale,
      mode,
      paypalOrderId: data.orderId
    });

    // Il vecchio frontend si aspetta: { success, paypalUrl }
    return res.json({
      success: true,
      paypalUrl: data.approvalUrl
    });

  } catch (err) {
    console.error("❌ Errore /api/paypal/create-order:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
