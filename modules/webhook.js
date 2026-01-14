// webhook.js
import express from "express";
import { sendWhatsAppMessage } from "./whatsapp.js";

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mewingmarket2026";

// 🔵 Verifica Webhook (Meta → Server)
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

// 🟢 Ricezione messaggi (Server → Bot)
router.post("/whatsapp", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from; // numero utente
      const text = message.text?.body || "";

      console.log("Messaggio ricevuto:", from, text);

      // Risposta automatica
      await sendWhatsAppMessage(from, `Ciao! Ho ricevuto il tuo messaggio: ${text}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Errore webhook:", error);
    res.sendStatus(500);
  }
});

export default router;
