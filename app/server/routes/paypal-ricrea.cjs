/**
 * =========================================================
 * PAYPAL — Rigenera pagamento ordine in attesa
 * Versione 2026.950
 * - Modulo paypal.cjs (createOrder)
 * - Modulo email-attesa.cjs (template premium)
 * - Lista 12 (clienti in attesa)
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");

// Moduli
const db = require(path.join(process.cwd(), "app/server/modules/db.cjs"));
const paypal = require(path.join(process.cwd(), "app/server/modules/paypal.cjs"));
const { inviaEmailAttesa } = require(path.join(process.cwd(), "app/server/modules/email-attesa.cjs"));
const { addToList } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

router.post("/ricrea/:id", async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  if (!userId || !orderId) {
    return res.json({ success: false, error: "Parametri mancanti." });
  }

  try {
    // 1) Recupera ordine
    const ordine = await db.getOrdine(orderId, userId);
    if (!ordine) return res.json({ success: false, error: "Ordine non trovato." });

    // 2) Rigenera link PayPal
    const paypalOrder = await paypal.createOrder({
      totale_cent: ordine.totale_cent,
      prodotti: ordine.prodotti
    });

    if (!paypalOrder?.url) {
      return res.json({ success: false, error: "Errore PayPal." });
    }

    // 3) Aggiorna ordine → in attesa pagamento
    await db.updateOrdine(orderId, {
      stato: "in_attesa_pagamento",
      paypal_id: paypalOrder.id
    });

    // 4) Aggiungi utente alla lista 12 (clienti in attesa)
    await addToList(12, ordine.email);

    // 5) Email premium (logo + social)
    await inviaEmailAttesa({
      email: ordine.email,
      url: paypalOrder.url
    });

    // 6) Risposta al frontend
    return res.json({
      success: true,
      url: paypalOrder.url
    });

  } catch (err) {
    console.error("Errore ricrea ordine:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
