/**
 * app/server/routes/newsletter.cjs
 * Gestione iscrizione newsletter
 */

const axios = require("axios");
const { trackGA4 } = require("../services/ga4.cjs");

module.exports = function (app) {
  /* =========================================================
     ISCRIZIONE NEWSLETTER
  ========================================================== */
  app.post("/newsletter/subscribe", async (req, res) => {
    const uid = req.uid;
    const email = req.body?.email || "";

    try {
      if (!email) {
        return res.json({ error: "Email mancante" });
      }

      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_subscribe_attempt", { uid, email });
      }

      // Chiamata al provider (Brevo / Sendinblue)
      const result = await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
          email,
          listIds: [2]
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      trackGA4("newsletter_subscribe", { uid, email });

      return res.json({ success: true, result: result.data });

    } catch (err) {
      console.error("❌ Errore /newsletter/subscribe:", err?.response?.data || err);

      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_subscribe_error", {
          uid,
          email,
          error: err?.message || "unknown"
        });
      }

      return res.json({ error: "Errore durante l'iscrizione" });
    }
  });

  /* =========================================================
     DISISCRIZIONE NEWSLETTER
  ========================================================== */
  app.post("/newsletter/unsubscribe", async (req, res) => {
    const uid = req.uid;
    const email = req.body?.email || "";

    try {
      if (!email) {
        return res.json({ error: "Email mancante" });
      }

      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_unsubscribe_attempt", { uid, email });
      }

      const result = await axios.post(
        "https://api.brevo.com/v3/contacts/unlink",
        { email },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      trackGA4("newsletter_unsubscribe", { uid, email });

      return res.json({ success: true, result: result.data });

    } catch (err) {
      console.error("❌ Errore /newsletter/unsubscribe:", err?.response?.data || err);

      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_unsubscribe_error", {
          uid,
          email,
          error: err?.message || "unknown"
        });
      }

      return res.json({ error: "Errore durante la disiscrizione" });
    }
  });

  /* =========================================================
     STATO NEWSLETTER
  ========================================================== */
  app.get("/newsletter/status", async (req, res) => {
    const uid = req.uid;
    const email = req.query?.email || "";

    try {
      if (!email) {
        return res.json({ error: "Email mancante" });
      }

      const result = await axios.get(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY
          }
        }
      );

      return res.json({
        subscribed: result.data?.listIds?.includes(2) || false,
        data: result.data
      });

    } catch (err) {
      console.error("❌ Errore /newsletter/status:", err?.response?.data || err);

      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_status_error", {
          uid,
          email,
          error: err?.message || "unknown"
        });
      }

      return res.json({ error: "Errore nel recupero dello stato" });
    }
  });
};
