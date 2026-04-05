// =====================================================
// FILE: app/modules/automazioni/segmentazione.cjs
// SCOPO: Segmentazione utenti (Brevo + tag interni)
// FUTURE-PROOF + DEBUG
// =====================================================

const { syncBrevoUtenteStatoReale } = require("../liste-brevo.cjs");

function debug(msg, data = null) {
  console.log(`[SEGMENTAZIONE] ${msg}`, data ? data : "");
}

async function segmentazione(utente) {
  try {
    debug("Segmentazione utente", utente.email);

    // Tag cliente
    if (utente.cliente_db === "sì") {
      await syncBrevoUtenteStatoReale({
        email: utente.email,
        cliente: true
      });
    }

    // Tag newsletter
    if (utente.newsletter === "sì") {
      await syncBrevoUtenteStatoReale({
        email: utente.email,
        newsletter: true
      });
    }

    // Tag interesse alto
    if (utente.visite_prodotto >= 3) {
      await syncBrevoUtenteStatoReale({
        email: utente.email,
        interesse_alto: true
      });
    }

  } catch (err) {
    console.error("[SEGMENTAZIONE] Errore:", err);
  }
}

module.exports = { segmentazione };
