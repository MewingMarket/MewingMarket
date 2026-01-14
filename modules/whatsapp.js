// whatsapp.js
import axios from "axios";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export async function sendWhatsAppMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    };

    const headers = {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Errore invio WhatsApp:", error.response?.data || error);
    return null;
  }
}

export async function sendTemplate(to, templateName, language = "it") {
  try {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language }
      }
    };

    const headers = {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Errore invio template:", error.response?.data || error);
    return null;
  }
}
