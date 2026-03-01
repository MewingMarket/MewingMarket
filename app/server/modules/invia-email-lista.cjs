// app/server/modules/invia-email-lista.cjs
const axios = require("axios");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

async function inviaEmailLista({ email, listId, subject, html, sender, attachments = [] }) {
  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY mancante");
    return;
  }

  if (!email || !subject || !html) {
    console.error("❌ Parametri email mancanti", { email, subject, listId });
    return;
  }

  try {
    // 1) Assicura contatto nella lista (solo se listId è presente)
    if (listId) {
      try {
        await axios.post(
          `${BREVO_API_BASE}/contacts`,
          {
            email,
            listIds: [listId]
          },
          {
            headers: {
              "api-key": BREVO_API_KEY,
              "Content-Type": "application/json"
            }
          }
        );
      } catch (err) {
        const code = err?.response?.status;
        if (code !== 400) {
          console.error("❌ Errore contatto Brevo:", err?.response?.data || err.message);
        }
      }
    }

    // 2) Prepara payload email
    const payload = {
      to: [{ email }],
      subject,
      htmlContent: html,
      sender: sender || {
        name: process.env.BREVO_SENDER_NAME || "MewingMarket",
        email: process.env.BREVO_SENDER_VENDITE || "no-reply@mewingmarket.com"
      },
      // ⭐ SOLO se ci sono allegati aggiungiamo "attachment"
      ...(attachments.length > 0
        ? {
            attachment: attachments.map(a => ({
              name: a.filename,
              content: a.content,
              type: a.mimeType || "application/pdf"
            }))
          }
        : {})
    };

    // 3) Invia email
    await axios.post(
      `${BREVO_API_BASE}/smtp/email`,
      payload,
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    console.error("❌ Errore inviaEmailLista:", err?.response?.data || err.message);
  }
}

module.exports = { inviaEmailLista };
