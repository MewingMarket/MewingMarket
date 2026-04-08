// =====================================================
// FILE: app/modules/automazioni/segmentazione.cjs
// SCOPO: Segmentazione utenti (Brevo + tag interni)
// FUTURE-PROOF + DEBUG + ANTI-LOOP + NO-OP intelligente
// =====================================================

const path = require("path");

// Percorso assoluto corretto → file reale: app/server/modules/liste-brevo.cjs
const { 
  syncBrevoUtenteStatoReale,
  getBrevoStatoRealeUtente   // 🔥 PATCH: serve per evitare update inutili
} = require(
  path.join(process.cwd(), "app/server/modules/liste-brevo.cjs")
);

// Anti-loop: cache in memoria per evitare invii ripetuti ravvicinati
const lastSegmentazione = new Map(); // uid/email → timestamp

function debug(msg, data = null) {
  console.log(`[SEGMENTAZIONE] ${msg}`, data ? data : "");
}

async function segmentazione(utente) {
  try {
    if (!utente || !utente.email) {
      debug("Utente non valido, skip");
      return;
    }

    const email = utente.email;

    // ============================
    // 1) ANTI-LOOP (debounce 10 minuti)
    // ============================
    const now = Date.now();
    const last = lastSegmentazione.get(email);

    if (last && now - last < 10 * 60 * 1000) {
      debug("Skip: segmentazione già eseguita di recente", email);
      return;
    }

    lastSegmentazione.set(email, now);

    debug("Segmentazione utente", email);

    // ============================
    // 2) COSTRUZIONE PAYLOAD
    // ============================

    const payload = {};

    if (utente.cliente_db === "sì") payload.cliente = true;
    if (utente.newsletter === "sì") payload.newsletter = true;
    if (utente.visite_prodotto >= 3) payload.interesse_alto = true;

    // Nessun tag da aggiornare → skip
    if (Object.keys(payload).length === 0) {
      debug("Nessun cambiamento da sincronizzare", email);
      return;
    }

    // ============================
    // 3) NO-OP INTELLIGENTE
    //    Evita chiamate inutili a Brevo
    // ============================

    const statoAttuale = await getBrevoStatoRealeUtente(email);

    if (statoAttuale) {
      const uguali = Object.keys(payload).every(
        key => statoAttuale[key] === payload[key]
      );

      if (uguali) {
        debug("Nessun cambiamento reale → skip update Brevo", payload);
        return;
      }
    }

    // ============================
    // 4) INVIO A BREVO (solo se serve)
    // ============================

    await syncBrevoUtenteStatoReale({
      email,
      ...payload
    });

    debug("Segmentazione completata", payload);

  } catch (err) {
    console.error("[SEGMENTAZIONE] Errore:", err);
  }
}

module.exports = { segmentazione };
