/**
 * =========================================================
 * File: app/server/routes/paypal-ricrea.cjs
 * PAYPAL — Rigenera pagamento ordine in attesa
 * Versione 2026.950 — require assoluti + FIX DB + FIX sicurezza
 * =========================================================
 */

const express = require("express");
const path = require("path");

const router = express.Router();

// PATCH: require assoluti
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const paypal = require(path.join(process.cwd(), "app/server/modules/paypal.cjs"));
const { inviaEmailAttesa } = require(path.join(process.cwd(), "app/server/modules/email-attesa.cjs"));
const { addToList } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const authUser = require(path.join(process.cwd(), "app/server/middleware/auth-user.cjs"));
const jsonGen = require(path.join(process.cwd(), "app/server/modules/generatore-json.cjs"));

/**
 * Helper sicuro per prodotti_json
 */
function safeParse(str) {
  try {
    if (!str) return [];
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/**
 * =========================================================
 * POST /api/paypal/ricrea/:id
 * Protetto da auth-user
 * =========================================================
 */
router.post("/paypal/ricrea/:id", authUser, async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  if (!userId || !orderId) {
    return res.json({ success: false, error: "Parametri mancanti." });
  }

  try {
    // 1) Recupera ordine dal DB, vincolato all'utente
    const stmtOrdine = db.prepare(`
      SELECT 
        o.id,
        o.utente_id,
        o.prodotti_json,
        o.totale_cent,
        o.stato,
        o.paypal_transaction_id,
        u.email AS utente_email
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      WHERE o.id = ? AND o.utente_id = ?
      LIMIT 1
    `);

    const ordine = stmtOrdine.get(orderId, userId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato." });
    }

    // Solo ordini non completati possono essere rigenerati
    if (ordine.stato === "completato") {
      return res.json({
        success: false,
        error: "Ordine già completato, non rigenerabile."
      });
    }

    // 2) Prepara dati per PayPal
    const prodotti = safeParse(ordine.prodotti_json);

    const paypalOrder = await paypal.createOrder({
      totale_cent: ordine.totale_cent,
      prodotti
    });

    if (!paypalOrder || !paypalOrder.id || !paypalOrder.url) {
      return res.json({ success: false, error: "Errore PayPal." });
    }

    // 3) Aggiorna ordine → in_attesa_pagamento + nuovo paypal_transaction_id
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET stato = 'in_attesa_pagamento',
          paypal_transaction_id = ?,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ? AND utente_id = ?
    `);

    stmtUpdate.run(paypalOrder.id, orderId, userId);

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON (ricrea):", err);
    }

    const emailUtente = ordine.utente_email || "";

    // 4) Aggiungi utente alla lista 12 (clienti in attesa)
    try {
      if (emailUtente) {
        await addToList(12, emailUtente);
      }
    } catch (err) {
      console.error("⚠️ Errore addToList (lista 12):", err);
    }

    // 5) Email premium (logo + social) — via inviaEmailLista (Brevo o sandbox)
    try {
      if (emailUtente) {
        await inviaEmailAttesa({
          email: emailUtente,
          url: paypalOrder.url
        });
      }
    } catch (err) {
      console.error("⚠️ Errore inviaEmailAttesa:", err);
    }

    // 6) Risposta al frontend
    return res.json({
      success: true,
      url: paypalOrder.url
    });

  } catch (err) {
    console.error("❌ Errore ricrea ordine:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
