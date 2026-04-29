/* =========================================================
   FILE: app/server/routes/paypal-create.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Crea ordine PayPal
   - Salva ordine nel DB
   - Aggiorna JSON mirror
   - Restituisce paypalUrl + orderId
========================================================= */

const path = require("path");
const fetch = require("node-fetch");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");

/* =========================================================
   FUNZIONE PRINCIPALE — paypalCreateOrder
========================================================= */
async function paypalCreateOrder(req) {
  console.log("[DEBUG paypal] paypalCreateOrder()");

  try {
    const { email, prodotti, totale } = req.body || {};

    if (!email || !Array.isArray(prodotti) || prodotti.length === 0) {
      return { success: false, error: "Dati ordine mancanti" };
    }

    const totaleCent = Math.round(Number(totale) * 100);
    const totaleEuro = (totaleCent / 100).toFixed(2);

    const result = db.prepare(`
      INSERT INTO ordini (
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        data_ordine
      ) VALUES (?, ?, ?, 'in_attesa_pagamento', 'PayPal', CURRENT_TIMESTAMP)
    `).run(
      req.user.id,
      JSON.stringify(prodotti),
      totaleCent
    );

    const ordineId = result.lastInsertRowid;

    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
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

    const raw = await paypalRes.text();
    console.log("[DEBUG paypal] RAW RESPONSE:", raw);

    let paypalData = null;
    try {
      paypalData = JSON.parse(raw);
    } catch (err) {
      console.log("[DEBUG paypal] JSON PARSE ERROR:", err);
    }

    if (!paypalData || !paypalData.id) {
      return { success: false, error: "Errore PayPal" };
    }

    const paypalTransactionId = paypalData.id;

    db.prepare(`
      UPDATE ordini
      SET paypal_transaction_id = ?
      WHERE id = ?
    `).run(paypalTransactionId, ordineId);

    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    const approveLink = paypalData.links?.find(l => l.rel === "approve");

    if (!approveLink) {
      return { success: false, error: "Nessun link PayPal trovato" };
    }

    return {
      success: true,
      paypalUrl: approveLink.href,
      orderId: ordineId
    };

  } catch (err) {
    console.error("❌ Errore paypalCreateOrder:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (ex POST /api/paypal/create-order)
========================================================= */
async function createOrder(req) {
  console.log("[DEBUG paypal] alias createOrder() → paypalCreateOrder()");
  return paypalCreateOrder(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  paypalCreateOrder,
  createOrder
};
