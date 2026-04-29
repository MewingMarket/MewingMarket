/* =========================================================
   FILE: app/server/routes/paypal-complete.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Completa ordine PayPal
   - Cattura pagamento
   - Aggiorna DB
   - Aggiorna JSON mirror
   - Salva vendite
   - Invia email acquisto
========================================================= */

const path = require("path");
const fetch = require("node-fetch");
const crypto = require("crypto");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { inviaEmailAcquisto } = R("modules/email-acquisto.cjs");
const { trackGA4 } = R("services/ga4.cjs");

/* =========================================================
   Helper JSON
========================================================= */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/* =========================================================
   FUNZIONE PRINCIPALE — paypalCompleteOrder
========================================================= */
async function paypalCompleteOrder(req) {
  console.log("[DEBUG paypal] paypalCompleteOrder()");

  try {
    const orderId = req.query.orderId;
    const userId = req.user.id;

    if (!orderId || !userId) {
      return { success: false, error: "Parametri mancanti" };
    }

    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `).get(orderId, userId);

    if (!ordine) {
      return { success: false, error: "Ordine non trovato" };
    }

    const paypalId = ordine.paypal_transaction_id;

    if (!paypalId) {
      return { success: false, error: "Transazione PayPal mancante" };
    }

    const utente = db.prepare(`
      SELECT email, codice_fiscale
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `).get(userId);

    const emailUtente = utente?.email || "";
    const codiceFiscale = utente?.codice_fiscale || "";

    if (ordine.stato === "completato") {
      return {
        success: true,
        order: {
          ...ordine,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        }
      };
    }

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
      return { success: false, error: "Pagamento non completato" };
    }

    const paypalCaptureId =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

    if (!paypalCaptureId) {
      return { success: false, error: "Capture PayPal non valida" };
    }

    const downloadToken = crypto.randomUUID();

    db.prepare(`
      UPDATE ordini
      SET download_token = ?
      WHERE id = ?
    `).run(downloadToken, orderId);

    db.prepare(`
      UPDATE ordini
      SET stato = 'completato',
          metodo_pagamento = 'PayPal',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);

    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders:", err);
    }

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

    trackGA4("ordine_completato", {
      ordine_id: ordine.id,
      totale: ordineFinale.totale
    });

    try {
      await inviaEmailAcquisto({
        email: emailUtente,
        ordine: ordineFinale
      });
    } catch (err) {
      console.error("❌ Errore invio email ordine:", err);
    }

    return {
      success: true,
      order: ordineFinale
    };

  } catch (err) {
    console.error("❌ Errore paypalCompleteOrder:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (ex GET /api/paypal/complete-order)
========================================================= */
async function completeOrder(req) {
  console.log("[DEBUG paypal] alias completeOrder() → paypalCompleteOrder()");
  return paypalCompleteOrder(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  paypalCompleteOrder,
  completeOrder
};
