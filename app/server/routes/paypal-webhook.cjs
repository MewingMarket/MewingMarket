/**
 * =========================================================
 * File: app/server/routes/paypal-webhook.cjs
 * Conferma pagamento PayPal
 * =========================================================
 */

const { createOrder } = require("../../modules/ordini.cjs");

module.exports = function (app) {

  app.post("/webhook/paypal", async (req, res) => {
    try {
      const event = req.body;

      if (event.event_type !== "CHECKOUT.ORDER.APPROVED") {
        return res.sendStatus(200);
      }

      const data = event.resource;

      const order = {
        paypal_order_id: data.id,
        prodotto_slug: data.purchase_units[0].custom_id,
        prezzo: data.purchase_units[0].amount.value,
        email_cliente: data.payer.email_address,
        stato: "paid",
        data: new Date().toISOString()
      };

      await createOrder(order);

      res.sendStatus(200);

    } catch (err) {
      console.error("❌ PayPal webhook error:", err);
      res.sendStatus(500);
    }
  });

};
