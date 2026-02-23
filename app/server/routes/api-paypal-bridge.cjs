// =========================================================
// File: app/server/routes/api-paypal-bridge.cjs
// Bridge PayPal legacy → nuovo PayPal Model A
// Usato da: checkout.js (vecchio frontend premium)
// =========================================================

const express = require("express");
const Airtable = require("airtable");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (per registrare l'ordine se serve)
// ---------------------------------------------------------
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;

const base = PAT && BASE ? new Airtable({ apiKey: PAT }).base(BASE) : null;
const TABLE_ORDINI = "Ordini";

// ---------------------------------------------------------
// Helper: crea ordine in Airtable (opzionale ma utile)
// ---------------------------------------------------------
async function registraOrdineAirtable({ email, prodotti, totale, mode, paypalOrderId }) {
  if (!base) return;

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
//    Usato da: checkout.js
//    Body: { email, prodotti, totale, mode }
// =========================================================
router.post("/paypal/create-order", async (req, res) => {
  const { email, prodotti, totale, mode } = req.body || {};

  if (!email || !Array.isArray(prodotti) || !prodotti.length) {
    return res.json({ success: false, error: "Dati ordine mancanti" });
  }

  // MODEL A → prendiamo solo il primo prodotto
  const prodotto = prodotti[0];

  try {
    // Qui assumo che tu abbia già un router nuovo tipo:
    // POST /api/paypal/create
    // con body: { email, slug, prezzo }
    //
    // Se il tuo endpoint reale è diverso, lo adattiamo.

    const fetch = (await import("node-fetch")).default;

    const resPaypal = await fetch(`${process.env.BASE_URL || "http://localhost:3000"}/api/paypal/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        slug: prodotto.slug,
        prezzo: Number(prodotto.prezzo || totale || 0)
      })
    });

    const data = await resPaypal.json().catch(() => null);

    if (!data || !data.success || !data.approvalUrl) {
      console.error("❌ Errore create PayPal:", data);
      return res.json({ success: false, error: "Errore creazione ordine PayPal" });
    }

    // Registra ordine in Airtable in formato "vecchio"
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
