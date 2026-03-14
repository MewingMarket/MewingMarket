/**
 * =========================================================
 * File: app/server/routes/paypal-complete.cjs
 * Completa ordine PayPal (SQL) + email + tracking + vendite
 * =========================================================
 */

const express = require("express");
const fetch = require("node-fetch");
const db = require("../db/database.cjs");

const { inviaEmailAcquisto } = require("../modules/email-acquisto.cjs");
const { inviaEmailLista } = require("../modules/invia-email-lista.cjs");
const { LISTA_CLIENTI } = require("../modules/liste-brevo.cjs");
const { trackGA4 } = require("../services/ga4.cjs");

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

    // 1) RECUPERA ORDINE DAL DB
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

    // Se già completato → non toccare
    if (ordine.stato === "completato") {
      return res.json({
        success: true,
        order: ordine,
        message: "Ordine già completato"
      });
    }

    // 2) CATTURA PAGAMENTO PAYPAL
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

    if (!captureData || !captureData.status) {
      return res.json({
        success: false,
        error: "Errore cattura PayPal"
      });
    }

    const paypalCaptureId = captureData.id || null;

    // 3) AGGIORNA ORDINE → COMPLETATO
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET stato = 'completato',
          metodo_pagamento = 'PayPal',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmtUpdate.run(orderId);

    // 4) PREPARA ORDINE PER EMAIL E FRONTEND
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

    // 5) SALVA VENDITE (una riga per prodotto)
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

    // 6) TRACKING GA4
    trackGA4("ordine_completato", {
      ordine_id: ordine.id,
      totale: ordineFinale.totale
    });

    // 7) LOG EVENTO INTERNO
    if (typeof global.logEvent === "function") {
      global.logEvent("ordine_completato", ordineFinale);
    }

    // 8) AGGIUNGI UTENTE ALLA LISTA CLIENTI
    try {
      await inviaEmailLista({
        email: req.user?.email || "",
        listId: LISTA_CLIENTI
      });
    } catch (err) {
      console.error("⚠️ Errore aggiunta lista clienti:", err);
    }

    // 9) INVIA EMAIL DI CONFERMA ORDINE
    try {
      await inviaEmailAcquisto({
        email: req.user?.email || "",
        ordine: ordineFinale
      });
    } catch (err) {
      console.error("❌ Errore invio email ordine:", err);
    }

    // 10) RITORNA ORDINE AL FRONTEND
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
