// app/server/modules/invia-email-lista.cjs
const axios = require("axios");
const { emailFirewall } = require("./email-firewall.cjs"); // 🔥 PATCH: firewall

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

/**
 * =========================================================
 * inviaEmailLista()
 * Modulo unico per inviare email via Brevo SMTP API
 * + FIREWALL 2026 — rate limit, duplicati, contenuto vuoto
 * =========================================================
 */
async function inviaEmailLista({
  email,
  listId,
  subject,
  html,
  sender,
  attachments = [],
  tipo = "marketing" // 🔥 default: marketing
}) {
  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY mancante");
    return;
  }

  if (!email || !subject || !html) {
    console.error("❌ Parametri email mancanti", { email, subject });
    return;
  }

  /* =========================================================
     🔥 FIREWALL — BLOCCA se non autorizzata
     (rate limit, duplicati, contenuto vuoto, ecc.)
  ========================================================== */
  const firewallResult = await emailFirewall({
    email,
    tipo,
    subject,
    html
  });

  if (firewallResult === "BLOCKED") {
    console.log(`⛔ [FIREWALL] Email bloccata (${tipo}) →`, subject);
    return "BLOCKED";
  }

  try {
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
    await axios.post(`${BREVO_API_BASE}/smtp/email`, payload, {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log(`📨 Email inviata (${tipo}) →`, subject);

    return "OK";

  } catch (err) {
    console.error("❌ Errore inviaEmailLista:", err?.response?.data || err.message);
    return "ERROR";
  }
}

module.exports = { inviaEmailLista };
