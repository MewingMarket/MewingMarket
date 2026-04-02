/**
 * app/server/routes/newsletter.cjs
 * Gestione iscrizione e disiscrizione newsletter (lista 8)
 */

const axios = require("axios");
const db = require("../db/database.cjs"); // PATCH: per newsletter_log
const { trackGA4 } = require("../services/ga4.cjs");

// ⭐ PATCH: importiamo il router Brevo centralizzato
const brevo = require("../modules/liste-brevo.cjs");

const { inviaEmailNewsletterBenvenuto } = require("../modules/email-newsletter.cjs");
const { inviaEmailNewsletterUnsubscribe } = require("../modules/email-newsletter-unsubscribe.cjs");

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

      // ⭐ PATCH BREVO — aggiunta tramite router centralizzato
      await brevo.addToList(brevo.LISTA_NEWSLETTER, email);

      trackGA4("newsletter_subscribe", { uid, email });

      // PATCH: log subscribe
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
     DISISCRIZIONE NEWSLETTER — ENDPOINT CORRETTO EU LEGACY
  ========================================================== */
  app.post("/newsletter/unsubscribe", async (req, res) => {
    const uid = req.uid;
    const rawEmail = req.body?.email || "";
    const email = String(rawEmail).trim().toLowerCase();

    if (!email) {
      return res.json({ success: false, error: "Email mancante" });
    }

    try {
      // ⭐ PATCH BREVO — rimozione tramite router centralizzato
      await brevo.removeFromList(brevo.LISTA_NEWSLETTER, email);

      trackGA4("newsletter_unsubscribe", { uid, email });

      // PATCH: log unsubscribe
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
      // ⭐ PATCH BREVO — recupero stato tramite API diretta (necessario)
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
        subscribed: result.data?.listIds?.includes(brevo.LISTA_NEWSLETTER) || false,
        data: result.data
      });

    } catch (err) {
      console.error("❌ Errore /newsletter/status:", err?.response?.data || err);
      return res.json({ success: false, error: "Errore nel recupero dello stato" });
    }
  });
};
