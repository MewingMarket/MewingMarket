/**
 * FILE: app/server/routes/newsletter.cjs
 * VERSIONE: 2027.3 — PATCH STABILE
 * MODALITÀ: Java‑mode (funzioni, no Express)
 * DESCRIZIONE: Gestione iscrizione e disiscrizione newsletter
 */

const axios = require("axios");
const path = require("path");

// require assoluti
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const { trackGA4 } = R("services/ga4.cjs");

const {
  syncBrevoUtenteStatoReale,
  LISTA_NEWSLETTER
} = R("modules/liste-brevo.cjs");

const { inviaEmailNewsletterBenvenuto } = R("modules/email-newsletter.cjs");
const { inviaEmailNewsletterUnsubscribe } = R("modules/email-newsletter-unsubscribe.cjs");

/* =========================================================
   Helper: scrivi log newsletter
========================================================= */
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
   1) ISCRIZIONE NEWSLETTER
   /api/newsletter/subscribe
========================================================= */
async function newsletterSubscribe(req) {
  console.log("[DEBUG newsletter] newsletterSubscribe()");

  const uid = req.uid || null;
  const rawEmail = req.body?.email || "";
  const email = String(rawEmail).trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email mancante" };
  }

  try {
    /* ---------------------------------------------------------
       TRACKING
    --------------------------------------------------------- */
    try {
      if (typeof global.logEvent === "function") {
        global.logEvent("newsletter_subscribe_attempt", { uid, email });
      }
    } catch {}

    /* ---------------------------------------------------------
       BREVO
    --------------------------------------------------------- */
    try {
      await syncBrevoUtenteStatoReale({
        email,
        newsletter: true
      });
    } catch (err) {
      console.warn("⚠️ syncBrevoUtenteStatoReale fallito:", err?.message);
    }

    /* ---------------------------------------------------------
       GA4
    --------------------------------------------------------- */
    try {
      trackGA4("newsletter_subscribe", { uid, email });
    } catch (err) {
      console.warn("⚠️ trackGA4 fallito:", err?.message);
    }

    /* ---------------------------------------------------------
       LOG
    --------------------------------------------------------- */
    logNewsletter({
      email,
      azione: "subscribe",
      origine: req.body?.origine || "form",
      note: null
    });

    /* ---------------------------------------------------------
       EMAIL BENVENUTO
    --------------------------------------------------------- */
    try {
      await inviaEmailNewsletterBenvenuto({ email });
    } catch (err) {
      console.warn("⚠️ inviaEmailNewsletterBenvenuto fallito:", err?.message);
    }

    return { success: true };

  } catch (err) {
    console.error("❌ Errore newsletterSubscribe:", err?.response?.data || err);
    return { success: false, error: "Errore durante l'iscrizione" };
  }
}

/* =========================================================
   2) DISISCRIZIONE NEWSLETTER
   /api/newsletter/unsubscribe
========================================================= */
async function newsletterUnsubscribe(req) {
  console.log("[DEBUG newsletter] newsletterUnsubscribe()");

  const uid = req.uid || null;
  const rawEmail = req.body?.email || "";
  const email = String(rawEmail).trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email mancante" };
  }

  try {
    /* ---------------------------------------------------------
       BREVO
    --------------------------------------------------------- */
    try {
      await syncBrevoUtenteStatoReale({
        email,
        newsletter: false
      });
    } catch (err) {
      console.warn("⚠️ syncBrevoUtenteStatoReale fallito:", err?.message);
    }

    /* ---------------------------------------------------------
       GA4
    --------------------------------------------------------- */
    try {
      trackGA4("newsletter_unsubscribe", { uid, email });
    } catch (err) {
      console.warn("⚠️ trackGA4 fallito:", err?.message);
    }

    /* ---------------------------------------------------------
       LOG
    --------------------------------------------------------- */
    logNewsletter({
      email,
      azione: "unsubscribe",
      origine: req.body?.origine || "form",
      note: null
    });

    /* ---------------------------------------------------------
       EMAIL DISISCRIZIONE
    --------------------------------------------------------- */
    try {
      await inviaEmailNewsletterUnsubscribe({ email });
    } catch (err) {
      console.warn("⚠️ inviaEmailNewsletterUnsubscribe fallito:", err?.message);
    }

    return { success: true };

  } catch (err) {
    console.error("❌ Errore newsletterUnsubscribe:", err?.response?.data || err);
    return { success: false, error: "Errore durante la disiscrizione" };
  }
}

/* =========================================================
   3) STATO NEWSLETTER
   /api/newsletter/status
========================================================= */
async function newsletterStatus(req) {
  console.log("[DEBUG newsletter] newsletterStatus()");

  const rawEmail = req.query?.email || "";
  const email = String(rawEmail).trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email mancante" };
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

    return {
      success: true,
      subscribed: result.data?.listIds?.includes(LISTA_NEWSLETTER) || false,
      data: result.data
    };

  } catch (err) {
    console.error("❌ Errore newsletterStatus:", err?.response?.data || err);
    return { success: false, error: "Errore nel recupero dello stato" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function subscribe(req) { return newsletterSubscribe(req); }
async function unsubscribe(req) { return newsletterUnsubscribe(req); }
async function status(req) { return newsletterStatus(req); }

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  newsletterSubscribe,
  newsletterUnsubscribe,
  newsletterStatus,

  // alias compatibilità
  subscribe,
  unsubscribe,
  status
};
