// webhook.js
const express = require("express");
const { sendWhatsAppMessage } = require("./whatsapp");
const { handleMenu } = require("./menu");

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mewingmarket2026";

// Verifica webhook (GET)
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook WhatsApp verificato");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Ricezione messaggi (POST)
router.post("/whatsapp", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("Messaggio ricevuto:", from, text);

      await handleMenu(from, text);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Errore webhook WhatsApp:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
