// app/server/modules/invia-email-lista.cjs

const path = require("path");

// PATCH: require assoluti
const axios = require("axios");
const nodemailer = require("nodemailer");
const { emailFirewall } = require(path.join(process.cwd(), "app/server/modules/email-firewall.cjs"));

// 🔥 PATCH: sandbox locale (layout perfetto)
const { sandboxSend } = require(path.join(process.cwd(), "app/server/modules/email-sandbox.cjs"));

// ⭐ LISTA BACKUP
const { LISTA_BACKUP } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

// 🔥 Modalità invio: "live" (Brevo) oppure "sandbox" (locale)
const EMAIL_MODE = process.env.EMAIL_MODE || "sandbox";

/**
 * =========================================================
 * inviaEmailLista()
 * + FIREWALL
 * + SANDBOX LOCALE (layout perfetto)
 * + LIVE MODE (Brevo)
 * + PATCH 2026 — modalità backup/restore
 * =========================================================
 */
async function inviaEmailLista({
  email,
  listId,
  subject,
  html,
  sender,
  attachments = [],
  tipo = "marketing",
  modalita = "normale"   // ⭐ nuovo parametro
}) {
  if (!email || !subject || !html) {
    console.error("❌ Parametri email mancanti", { email, subject });
    return;
  }

  /* =========================================================
     ⭐ PATCH 2026 — modalità backup/restore
     Bypass firewall + tracking + limiti
  ========================================================== */
  if (modalita === "backup" || modalita === "restore") {
    console.log("📨 [BACKUP/RESTORE] Invio forzato → LISTA_BACKUP");

    // SANDBOX
    if (EMAIL_MODE !== "live") {
      return sandboxSend({
        email,
        subject,
        html,
        tipo: "backup",
        sender,
        attachments
      });
    }

    // LIVE
    try {
      const payload = {
        to: [{ email }],
        subject,
        htmlContent: html,
        sender: sender || {
          name: process.env.BREVO_SENDER_NAME || "MewingMarket",
          email: process.env.BREVO_SENDER_VENDITE || "no-reply@mewingmarket.it"
        },
        attachment: attachments
      };

      await axios.post(`${BREVO_API_BASE}/smtp/email`, payload, {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      });

      console.log("📨 [BACKUP/RESTORE] Email inviata →", subject);
      return "OK";

    } catch (err) {
      console.error("❌ Errore invio backup/restore:", err?.response?.data || err.message);
      return "ERROR";
    }
  }

  /* =========================================================
     🔥 FIREWALL (solo per email normali)
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
     🔥 SANDBOX MODE — SALVATAGGIO LOCALE (layout perfetto)
  ========================================================== */
  if (EMAIL_MODE !== "live") {
    console.log("📨 [SANDBOX] Salvataggio email locale (email-sandbox.cjs)");
    return sandboxSend({ email, subject, html, tipo, sender, attachments });
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
      attachment: attachments
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
