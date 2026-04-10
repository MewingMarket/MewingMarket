/**
 * app/server/routes/newsletter.cjs
 * Gestione iscrizione e disiscrizione newsletter (lista 8)
 * Versione 2026.200 — require assoluti
 */

const axios = require("axios");
const path = require("path");

// PATCH: require assoluti
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const { trackGA4 } = R("services/ga4.cjs");

// ⭐ PATCH: importiamo syncBrevoUtenteStatoReale
const {
  syncBrevoUtenteStatoReale,
  LISTA_NEWSLETTER
} = R("modules/liste-brevo.cjs");

const { inviaEmailNewsletterBenvenuto } = R("modules/email-newsletter.cjs");
const { inviaEmailNewsletterUnsubscribe } = R("modules/email-newsletter-unsubscribe.cjs");

module.exports = function (app) {

  /* =========================================================
     Helper: scrivi log newsletter
  ========================================================== */
  function logNewsletter({ email, azione, origine = null, note = null }) {
    try {
      db.prepare(`
        INSERT INTO newsletter_log (email, azione, origine, note)
        VALUES (?, ?, ?, ?)
      `).run(email, azione, origine, note);
    } catch (err) {
      console.error("❌ Errore salvataggio newsletter_log:", err);
    }
  }

  /* =========================================================
     ISCRIZIONE NEWSLETTER
  ========================================================== */
  app.post("/newsletter/subscribe", async (req, res) => {
    const uid = req.uid;
    const rawEmail = req.body?.email || "";
    const email = String(rawEmail).trim().toLowerCase();

    if (!email) {
      return res.json({ success: false, error: "Email mancante" });
    }

    try {
      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_subscribe_attempt", { uid, email });
      }

      // ⭐ PATCH BREVO — sync centrale
      await syncBrevoUtenteStatoReale({
        email,
        newsletter: true
      });

      trackGA4("newsletter_subscribe", { uid, email });

      logNewsletter({
        email,
        azione: "subscribe",
        origine: req.body?.origine || "form",
        note: null
      });

      await inviaEmailNewsletterBenvenuto({ email });

      return res.json({ success: true });

    } catch (err) {
      console.error("❌ Errore /newsletter/subscribe:", err?.response?.data || err);
      return res.json({ success: false, error: "Errore durante l'iscrizione" });
    }
  });

  /* =========================================================
     DISISCRIZIONE NEWSLETTER
  ========================================================== */
  app.post("/newsletter/unsubscribe", async (req, res) => {
    const uid = req.uid;
    const rawEmail = req.body?.email || "";
    const email = String(rawEmail).trim().toLowerCase();

    if (!email) {
      return res.json({ success: false, error: "Email mancante" });
    }

    try {
      // ⭐ PATCH BREVO — sync centrale
      await syncBrevoUtenteStatoReale({
        email,
        newsletter: false
      });

      trackGA4("newsletter_unsubscribe", { uid, email });

      logNewsletter({
        email,
        azione: "unsubscribe",
        origine: req.body?.origine || "form",
        note: null
      });

      await inviaEmailNewsletterUnsubscribe({ email });

      return res.json({ success: true });

    } catch (err) {
      console.error("❌ Errore /newsletter/unsubscribe:", err?.response?.data || err);
      return res.json({ success: false, error: "Errore durante la disiscrizione" });
    }
  });

  /* =========================================================
     STATO NEWSLETTER
  ========================================================== */
  app.get("/newsletter/status", async (req, res) => {
    const rawEmail = req.query?.email || "";
    const email = String(rawEmail).trim().toLowerCase();

    if (!email) {
      return res.json({ success: false, error: "Email mancante" });
    }

    try {
      const result = await axios.get(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY
          }
        }
      );

      return res.json({
        success: true,
        subscribed: result.data?.listIds?.includes(LISTA_NEWSLETTER) || false,
        data: result.data
      });

    } catch (err) {
      console.error("❌ Errore /newsletter/status:", err?.response?.data || err);
      return res.json({ success: false, error: "Errore nel recupero dello stato" });
    }
  });
};
