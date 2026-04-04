/**
 * =========================================================
 * File: app/server/routes/paypal-complete.cjs
 * Completa ordine PayPal (SQL) + email + tracking + vendite + JSON mirror
 * PATCH 2026.2001 — token download + codice fiscale + ordineFinale completo
 * =========================================================
 */

const express = require("express");
const fetch = require("node-fetch");
const crypto = require("crypto");
const db = require("../db/database.cjs");

const { inviaEmailAcquisto } = require("../modules/email-acquisto.cjs");
const { trackGA4 } = require("../services/ga4.cjs");
const jsonGen = require("../modules/generatore-json.cjs");

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
    // 2) RECUPERA EMAIL + CODICE FISCALE UTENTE
    // =========================================================
    const stmtUser = db.prepare(`
      SELECT email, codice_fiscale
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `);

    const utente = stmtUser.get(ordine.utente_id);
    const emailUtente = utente?.email || "";
    const codiceFiscale = utente?.codice_fiscale || "";

    // =========================================================
    // 3) SE GIÀ COMPLETATO → NON DUPLICARE
    // =========================================================
    if (ordine.stato === "completato") {
      return res.json({
        success: true,
        order: {
          ...ordine,
          id_ordine: ordine.id,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        },
        message: "Ordine già completato"
      });
    }

    // =========================================================
    // 4) CATTURA PAGAMENTO PAYPAL
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

    const captureRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            CLIENT_ID + ":" + SECRET
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
    // 5) GENERA TOKEN DOWNLOAD MONOUSO
    // =========================================================
    const downloadToken = crypto.randomUUID();

    const stmtToken = db.prepare(`
      UPDATE ordini
      SET download_token = ?
      WHERE id = ?
    `);

    stmtToken.run(downloadToken, orderId);

    // =========================================================
    // 6) AGGIORNA ORDINE → COMPLETATO
    // =========================================================
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET stato = 'completato',
          metodo_pagamento = 'PayPal',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmtUpdate.run(orderId);

    try {
      await jsonGen.exportOrders();
    } catch {}

    // =========================================================
    // 7) PREPARA ORDINE PER EMAIL E FRONTEND
    // =========================================================
    const prodotti = safeParse(ordine.prodotti_json);

    const ordineFinale = {
      id: ordine.id,
      id_ordine: ordine.id,
      utente_id: ordine.utente_id,
      prodotti,
      totale: ordine.totale_cent / 100,
      totale_cent: ordine.totale_cent,
      data: new Date().toISOString(),
      stato: "completato",
      metodo_pagamento: "PayPal",
      paypal_transaction_id: paypalId,
      paypal_capture_id: paypalCaptureId,

      // ⭐ PATCH
      codice_fiscale: codiceFiscale,
      download_token: downloadToken
    };

    // =========================================================
    // 8) SALVA VENDITE
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

    try {
      await jsonGen.exportSales();
    } catch {}

    // =========================================================
    // 9) TRACKING GA4
    // =========================================================
    trackGA4("ordine_completato", {
      ordine_id: ordine.id,
      totale: ordineFinale.totale
    });

    // =========================================================
    // 10) EMAIL ACQUISTO
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
    // ⭐ 11) PATCH BREVO — pagamento completato → diventa cliente
    // =========================================================
    try {
      const { syncBrevoUtenteStatoReale } = require("../modules/liste-brevo.cjs");
      await syncBrevoUtenteStatoReale({
        email: emailUtente,
        cliente: true
      });
    } catch (err) {
      console.error("❌ Errore sync Brevo:", err);
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
