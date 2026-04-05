/**
 * =========================================================
 * File: app/server/modules/email-feedback.cjs
 * Email ringraziamento feedback — Versione premium 2026
 * =========================================================
 */

const { inviaEmailAutomatica } = require("./email-senders.cjs");

async function inviaEmailFeedback({ email, prodotto_id, rating, commento }) {
  try {
    console.log("📨 [DEBUG] inviaEmailFeedback →", email);

    await inviaEmailAutomatica({
      to: email,
      template: "feedback_ricevuto",
      dati: {
        prodotto_id,
        rating,
        commento
      }
    });

    console.log("✅ [DEBUG] Email feedback inviata");

  } catch (err) {
    console.error("❌ [DEBUG] Errore invio email feedback:", err);
  }
}

module.exports = { inviaEmailFeedback };
