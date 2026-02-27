/**
 * app/server/routes/newsletter.cjs
 * Gestione iscrizione e disiscrizione newsletter (lista 8)
 */

const axios = require("axios");
const { trackGA4 } = require("../services/ga4.cjs");
const { LISTA_NEWSLETTER } = require("../modules/liste-brevo.cjs");
const { inviaEmailNewsletterBenvenuto } = require("../modules/email-newsletter.cjs");
const { inviaEmailNewsletterUnsubscribe } = require("../modules/email-newsletter-unsubscribe.cjs");

module.exports = function (app) {

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

      // Aggiunge alla lista newsletter
      await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
          email,
          listIds: [LISTA_NEWSLETTER],
          updateEnabled: true
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      // Tracking GA4
      trackGA4("newsletter_subscribe", { uid, email });

      // Email di benvenuto
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
      // Rimuove dalla lista newsletter
      await axios.post(
        "https://api.brevo.com/v3/contacts/unlink",
        { email },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      // Tracking GA4
      trackGA4("newsletter_unsubscribe", { uid, email });

      // Email post-disicrizione
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
