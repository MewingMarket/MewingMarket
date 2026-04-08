/**
 * =========================================================
 * File: app/server/modules/email-feedback.cjs
 * Email ringraziamento feedback — Versione premium 2026
 * PATCH: aggiunti dati grafici per template Brevo
 * =========================================================
 */

const { inviaEmailAutomatica } = require("./email-senders.cjs");

async function inviaEmailFeedback({ email, prodotto_id, rating, commento }) {
  try {
    console.log("📨 [DEBUG] inviaEmailFeedback →", email);

    await inviaEmailAutomatica({
      to: email,
      template: "feedback_ricevuto",

      // 🔥 FIREWALL: questa è un'email transazionale
      tipo: "transazionale",

      // 🔥 DATI ORIGINALI (non toccati)
      dati: {
        prodotto_id,
        rating,
        commento,

        // 🔥 PATCH — dati grafici per template universale
        logo_url: "https://www.mewingmarket.it/logo.png",

        social: {
          facebook: "https://www.facebook.com/profile.php?id=61584779793628",
          threads: "https://www.threads.com/@mewingmarket",
          instagram: "https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt",
          tiktok: "https://tiktok.com/@mewingmarket",
          x: "https://x.com/mewingm8",
          youtube: "https://www.youtube.com/@mewingmarket2",
          linkedin: "https://www.linkedin.com/in/simone-griseri-5368a7394"
        },

        // 🔥 PATCH — link newsletter
        link_iscrizione: "https://www.mewingmarket.it/iscrizione.html",
        link_disiscrizione: "https://www.mewingmarket.it/disiscriviti.html",

        // 🔥 PATCH — footer legale
        footer_legale:
          "© " +
          new Date().getFullYear() +
          " MewingMarket — Prodotti digitali creati con Intelligenza Artificiale. Tutti i diritti riservati."
      }
    });

    console.log("✅ [DEBUG] Email feedback inviata");

  } catch (err) {
    console.error("❌ [DEBUG] Errore invio email feedback:", err);
  }
}

module.exports = { inviaEmailFeedback };
