// app/server/modules/invia-email-lista.cjs
const axios = require("axios");
const { emailFirewall } = require("./email-firewall.cjs");

// SANDBOX (simulatore locale)
const { sandboxSend } = require("./email-sandbox.cjs");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

// 🔥 Modalità invio: "live" oppure "sandbox"
const EMAIL_MODE = process.env.EMAIL_MODE || "sandbox";

/**
 * =========================================================
 * inviaEmailLista()
 * Modulo unico per inviare email via Brevo SMTP API
 * + FIREWALL 2026 — rate limit, duplicati, contenuto vuoto
 * + SANDBOX MODE — test locale senza Brevo
 * =========================================================
 */
async function inviaEmailLista({
  email,
  listId,
  subject,
  html,
  sender,
  attachments = [],
  tipo = "marketing"
}) {
  if (!email || !subject || !html) {
    console.error("❌ Parametri email mancanti", { email, subject });
    return;
  }

  /* =========================================================
     🔥 FIREWALL — BLOCCA se non autorizzata
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

  /* =========================================================
     🔥 SANDBOX MODE — salva email in locale
  ========================================================== */
  if (EMAIL_MODE !== "live") {
    console.log("📨 [SANDBOX] Email intercettata → nessun invio reale");
    return sandboxSend({
      email,
      subject,
      html,
      tipo,
      sender
    });
  }

  /* =========================================================
     🔥 LIVE MODE — invio reale via Brevo
  ========================================================== */
  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY mancante (LIVE MODE)");
    return "ERROR_NO_KEY";
  }

  try {
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
