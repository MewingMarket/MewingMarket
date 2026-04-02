// app/server/modules/invia-email-lista.cjs
const axios = require("axios");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

/**
 * =========================================================
 * inviaEmailLista()
 * Modulo unico per inviare email via Brevo SMTP API
 * (NON gestisce più le liste — ora lo fa liste-brevo.cjs)
 * =========================================================
 */
async function inviaEmailLista({ email, listId, subject, html, sender, attachments = [] }) {
  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY mancante");
    return;
  }

  if (!email || !subject || !html) {
    console.error("❌ Parametri email mancanti", { email, subject });
    return;
  }

  try {
    // ⭐ PATCH 2026 — RIMOSSA gestione liste
    // Ora le liste sono gestite SOLO da liste-brevo.cjs
    // (addToList / removeFromList / syncLists)

    // Prepara payload email
    const payload = {
      to: [{ email }],
      subject,
      htmlContent: html,
      sender: sender || {
        name: process.env.BREVO_SENDER_NAME || "MewingMarket",
        email: process.env.BREVO_SENDER_VENDITE || "no-reply@mewingmarket.it"
      },
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

    // Invia email via Brevo SMTP API
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
