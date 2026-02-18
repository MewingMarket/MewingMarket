/**
 * app/server/routes/payhip-webhook.cjs
 * Webhook Payhip — vendite
 */

const crypto = require("crypto");

// PATCH: percorso corretto verso airtable.cjs
const { saveSaleToAirtable } = require("../../modules/airtable.cjs");

module.exports = function (app) {
  app.post("/payhip/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-payhip-signature"];
      const secret = process.env.PAYHIP_WEBHOOK_SECRET;

      if (!signature || !secret) {
        if (typeof global.logEvent === "function") {
          global.logEvent("payhip_webhook_missing_signature", {});
        }
        return res.status(400).send("Missing signature");
      }

      const bodyString = JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", secret)
        .update(bodyString)
        .digest("hex");

      if (signature !== expected) {
        if (typeof global.logEvent === "function") {
          global.logEvent("payhip_webhook_invalid_signature", {});
        }
        return res.status(401).send("Invalid signature");
      }

      // Log evento Payhip
      if (typeof global.logEvent === "function") {
        global.logEvent("payhip_webhook_received", req.body);
      }

      // 🔥 Salva la vendita in Airtable usando la funzione reale
      try {
        await saveSaleToAirtable(req.body);
      } catch (err) {
        console.error("Errore saveSaleToAirtable:", err);
        if (typeof global.logEvent === "function") {
          global.logEvent("payhip_save_sale_error", {
            error: err?.message || "unknown"
          });
        }
      }

      return res.status(200).send("OK");

    } catch (err) {
      console.error("❌ Errore webhook Payhip:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("payhip_webhook_error", {
          error: err?.message || "unknown"
        });
      }

      return res.status(500).send("Webhook error");
    }
  });
};
