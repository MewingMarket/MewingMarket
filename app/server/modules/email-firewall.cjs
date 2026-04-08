// =====================================================
// FILE: app/server/modules/email-firewall.cjs
// FIREWALL EMAIL ENTERPRISE — Versione definitiva 2026
// =====================================================

const path = require("path");
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { SENDER_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

// Cache anti-loop (in-memory)
const lastSend = new Map(); // key → timestamp

// Limiti per tipo di email (in millisecondi)
const LIMITS = {
  // Report mensile → 1 volta al mese
  report_mensile: 1000 * 60 * 60 * 24 * 30,

  // Segmentazione → 1 volta al giorno
  segmentazione: 1000 * 60 * 60 * 24,

  // Novità → 1 volta a settimana
  novita: 1000 * 60 * 60 * 24 * 7,

  // Proposte prodotto → 1 volta a settimana
  proposte: 1000 * 60 * 60 * 24 * 7,

  // Email transazionali → SEMPRE PERMESSE
  transazionale: 0
};

function debug(msg, data = null) {
  console.log(`[EMAIL-FIREWALL] ${msg}`, data ? data : "");
}

/**
 * Invio email sicuro con rate-limit + contenuto obbligatorio
 */
async function safeSend({ key, to, subject, html, sender = SENDER_NEWSLETTER }) {
  try {
    // 1) Contenuto obbligatorio
    if (!html || html.trim().length < 20) {
      console.error("[EMAIL-FIREWALL] Errore: contenuto email vuoto o insufficiente");
      return "ERROR_EMPTY_CONTENT";
    }

    const now = Date.now();
    const last = lastSend.get(key);
    const limit = LIMITS[key] ?? 0;

    // 2) Rate limit
    if (last && now - last < limit) {
      debug("SKIP: rate limit attivo", { key, to });
      return "SKIPPED_RATE_LIMIT";
    }

    // 3) Aggiorna timestamp
    lastSend.set(key, now);

    // 4) Invio reale
    debug("Invio email autorizzato", { key, to });

    return await inviaEmailLista({
      email: to,
      listId: null,
      subject,
      html,
      sender
    });

  } catch (err) {
    console.error("[EMAIL-FIREWALL] Errore invio:", err);
    return "ERROR";
  }
}

module.exports = { safeSend };
