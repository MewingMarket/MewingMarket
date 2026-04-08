// app/server/modules/invia-email-lista.cjs
const axios = require("axios");
const nodemailer = require("nodemailer");
const { emailFirewall } = require("./email-firewall.cjs");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

// 🔥 Modalità invio: "live" (Brevo) oppure "sandbox" (Gmail SMTP)
const EMAIL_MODE = process.env.EMAIL_MODE || "sandbox";

/**
 * =========================================================
 * inviaEmailLista()
 * + FIREWALL
 * + SANDBOX SMTP (Gmail)
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
     🔥 FIREWALL
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
     🔥 SANDBOX MODE — invio reale via Gmail SMTP
  ========================================================== */
  if (EMAIL_MODE !== "live") {
    console.log("📨 [SANDBOX] Invio email tramite Gmail SMTP");

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SANDBOX_EMAIL,      // es: mewingmarket2@gmail.com
          pass: process.env.SANDBOX_PASSWORD    // password app Gmail
        }
      });

      await transporter.sendMail({
        from: sender?.email || process.env.SANDBOX_EMAIL,
        to: email,
        subject,
        html
      });

      console.log("📨 [SANDBOX] Email inviata a Gmail →", email);
      return "SANDBOX_OK";

    } catch (err) {
      console.error("❌ Errore SANDBOX SMTP:", err.message);
      return "SANDBOX_ERROR";
    }
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
      }
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
