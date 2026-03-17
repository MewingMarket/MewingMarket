/**
 * =========================================================
 * File: app/server/routes/paypal-complete.cjs
 * Completa ordine PayPal (SQL) + email + tracking + vendite + JSON mirror
 * =========================================================
 */

const express = require("express");
const fetch = require("node-fetch");
const db = require("../db/database.cjs");

const { inviaEmailAcquisto } = require("../modules/email-acquisto.cjs");
const { inviaEmailLista } = require("../modules/invia-email-lista.cjs");
const { LISTA_CLIENTI } = require("../modules/liste-brevo.cjs");
const { trackGA4 } = require("../services/ga4.cjs");
const jsonGen = require(".../modules/generatore-json.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/paypal/complete-order?orderId=xxxx
 * =========================================================
 */
router.get("/paypal/complete-order", async (req, res) => {
  try {
    const orderId = req.query.orderId;

    if (!orderId) {
      return res.json({ success: false, error: "OrderId mancante" });
    }

    // =========================================================
    // 1) RECUPERA ORDINE DAL DB
    // =========================================================
    const stmtFind = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ?
    `);

    const ordine = stmtFind.get(orderId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    const paypalId = ordine.paypal_transaction_id;

    if (!paypalId) {
      return res.json({ success: false, error: "Transazione PayPal mancante" });
    }

    // =========================================================
    // 2) RECUPERA EMAIL UTENTE DAL DB (NO req.user)
    // =========================================================
    const stmtUser = db.prepare(`
      SELECT email
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `);

    const utente = stmtUser.get(ordine.utente_id);
    const emailUtente = utente?.email || "";

    // =========================================================
    // 3) SE GIÀ COMPLETATO → NON DUPLICARE
    // =========================================================
    if (ordine.stato === "completato") {
      return res.json({
        success: true,
        order: {
          ...ordine,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        },
        message: "Ordine già completato"
      });
    }

    // =========================================================
    // 4) CATTURA PAGAMENTO PAYPAL
    // =========================================================
    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${paypalId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
          ).toString("base64")}`
        }
      }
    );

    const captureData = await captureRes.json().catch(() => null);

    if (!captureData || captureData.status !== "COMPLETED") {
      return res.json({
        success: false,
        error: "Pagamento non completato"
      });
    }

    const paypalCaptureId = captureData.id || null;

    // =========================================================
    // 5) AGGIORNA ORDINE → COMPLETATO
    // =========================================================
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET stato = 'completato',
          metodo_pagamento = 'PayPal',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmtUpdate.run(orderId);

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    // =========================================================
    // 6) PREPARA ORDINE PER EMAIL E FRONTEND
    // =========================================================
    const prodotti = safeParse(ordine.prodotti_json);

    const ordineFinale = {
      id: ordine.id,
      utente_id: ordine.utente_id,
      prodotti,
      totale: ordine.totale_cent / 100,
      totale_cent: ordine.totale_cent,
      data: new Date().toISOString(),
      stato: "completato",
      metodo_pagamento: "PayPal",
      paypal_transaction_id: paypalId,
      paypal_capture_id: paypalCaptureId
    };

    // =========================================================
    // 7) SALVA VENDITE (una riga per prodotto)
    // =========================================================
    const stmtVendita = db.prepare(`
      INSERT INTO vendite (
        uid,
        prodotto_id,
        prezzo_cent,
        origine,
        utm_source,
        utm_campaign,
        utm_medium,
        referrer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of prodotti) {
      stmtVendita.run(
        "order_" + ordine.id,
        p.prodotto_id,
        p.prezzo_cent,
        null,
        null,
        null,
        null,
        null
      );
    }

    // 🔥 Aggiorna JSON mirror vendite
    try {
      await jsonGen.exportSales();
    } catch (err) {
      console.error("⚠️ Errore exportSales JSON:", err);
    }

    // =========================================================
    // 8) TRACKING GA4
    // =========================================================
    trackGA4("ordine_completato", {
      ordine_id: ordine.id,
      totale: ordineFinale.totale
    });

    // =========================================================
    // 9) LOG EVENTO INTERNO
    // =========================================================
    if (typeof global.logEvent === "function") {
      global.logEvent("ordine_completato", ordineFinale);
    }

    // =========================================================
    // 10) AGGIUNGI UTENTE ALLA LISTA CLIENTI
    // =========================================================
    try {
      await inviaEmailLista({
        email: emailUtente,
        listId: LISTA_CLIENTI
      });
    } catch (err) {
      console.error("⚠️ Errore aggiunta lista clienti:", err);
    }

    // =========================================================
    // 11) INVIA EMAIL DI CONFERMA ORDINE
    // =========================================================
    try {
      await inviaEmailAcquisto({
        email: emailUtente,
        ordine: ordineFinale
      });
    } catch (err) {
      console.error("❌ Errore invio email ordine:", err);
    }

    // =========================================================
    // 12) RITORNA ORDINE AL FRONTEND
    // =========================================================
    return res.json({
      success: true,
      order: ordineFinale
    });

  } catch (err) {
    console.error("❌ Errore complete-order:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

/**
 * Helper sicuro per JSON
 */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

module.exports = router;
