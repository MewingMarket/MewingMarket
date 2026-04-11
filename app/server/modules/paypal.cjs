/**
 * =========================================================
 * PAYPAL — Modulo centrale
 * Versione 2026.950
 * - createOrder()
 * - captureOrder()
 * - cancelOrder()
 * =========================================================
 */

const path = require("path");
const axios = require("axios");

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = "https://api-m.paypal.com"; // LIVE

/* =========================================================
   TOKEN PAYPAL
========================================================= */
async function getToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const res = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
    auth: {
      username: PAYPAL_CLIENT,
      password: PAYPAL_SECRET
    }
  });

  return res.data.access_token;
}

/* =========================================================
   CREA ORDINE PAYPAL
========================================================= */
async function createOrder({ totale_cent, prodotti }) {
  const token = await getToken();

  const totale = (totale_cent / 100).toFixed(2);

  const res = await axios.post(
    `${PAYPAL_API}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: totale
          }
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  const order = res.data;

  const approveLink = order.links.find(l => l.rel === "approve")?.href;

  return {
    id: order.id,
    url: approveLink
  };
}

/* =========================================================
   CAPTURE
========================================================= */
async function captureOrder(orderId) {
  const token = await getToken();

  const res = await axios.post(
    `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data;
}

/* =========================================================
   CANCEL
========================================================= */
async function cancelOrder(orderId) {
  return { success: true };
}

module.exports = {
  createOrder,
  captureOrder,
  cancelOrder
};
