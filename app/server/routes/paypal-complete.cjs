/**
 * =========================================================
 * File: app/server/routes/paypal-complete.cjs
 * Completa ordine PayPal (SQL) + email + vendite + JSON mirror
 * Versione 2026.950 — require assoluti + FIX totale + FIX sicurezza
 * =========================================================
 */

const express = require("express");
const fetch = require("node-fetch");
const crypto = require("crypto");
const path = require("path");

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { inviaEmailAcquisto } = R("modules/email-acquisto.cjs");
const { trackGA4 } = R("services/ga4.cjs");
const authUser = R("middleware/auth-user.cjs");

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

const router = express.Router();

/**
 * =========================================================
 * GET /api/paypal/complete-order?orderId=xxxx
 * Protetto da auth-user
 * =========================================================
 */
router.get("/paypal/complete-order", authUser, async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const userId = req.user.id;

    if (!orderId || !userId) {
      return res.json({ success: false, error: "Parametri mancanti" });
    }

    // =========================================================
    // 1) Recupera ordine dal DB
    // =========================================================
    const stmtFind = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `);

    const ordine = stmtFind.get(orderId, userId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    const paypalId = ordine.paypal_transaction_id;

    if (!paypalId) {
      return res.json({ success: false, error: "Transazione PayPal mancante" });
    }

    // =========================================================
    // 2) Recupera email utente
    // =========================================================
    const stmtUser = db.prepare(`
      SELECT email, codice_fiscale
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `);

    const utente = stmtUser.get(userId);
    const emailUtente = utente?.email || "";
    const codiceFiscale = utente?.codice_fiscale || "";

    // =========================================================
    // 3) Se già completato → ritorna ordine
    // =========================================================
    if (ordine.stato === "completato") {
      return res.json({
        success: true,
        order: {
          ...ordine,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        }
      });
    }

    // =========================================================
    // 4) Cattura pagamento PayPal
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

    const raw = await captureRes.text();
    let captureData = null;

    try {
      captureData = JSON.parse(raw);
    } catch (err) {
      console.error("❌ ERRORE PARSE CAPTURE JSON:", err);
    }

    if (!captureData || captureData.status !== "COMPLETED") {
      return res.json({
        success: false,
        error: "Pagamento non completato"
      });
    }

    const paypalCaptureId =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

    if (!paypalCaptureId) {
      return res.json({
        success: false,
        error: "Capture PayPal non valida"
      });
    }

    // =========================================================
    // 5) Genera token download monouso
    // =========================================================
    const downloadToken = crypto.randomUUID();

    db.prepare(`
      UPDATE ordini
      SET download_token = ?
      WHERE id = ?
    `).run(downloadToken, orderId);

    // =========================================================
    // 6) Aggiorna ordine → completato
    // =========================================================
    db.prepare(`
      UPDATE ordini
      SET stato = 'completato',
          metodo_pagamento = 'PayPal',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);

    // Aggiorna JSON mirror
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders:", err);
    }

    // =========================================================
    // 7) Prepara ordine finale
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
      codice_fiscale: codiceFiscale,
      download_token: downloadToken
    };

    // =========================================================
    // 8) Salva vendite
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
    } catch (err) {
      console.error("⚠️ Errore exportSales:", err);
    }

    // =========================================================
    // 9) Tracking GA4
    // =========================================================
    trackGA4("ordine_completato", {
      ordine_id: ordine.id,
      totale: ordineFinale.totale
    });

    // =========================================================
    // 10) Email acquisto (Brevo o sandbox fallback)
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
    // 11) Risposta al frontend
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

module.exports = router; 
