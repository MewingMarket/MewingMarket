// =====================================================
// FILE: app/server/modules/email-firewall.cjs
// FIREWALL EMAIL ENTERPRISE — Versione definitiva 2026
// =====================================================

// Cache anti-loop (in-memory)
const lastSend = new Map(); // tipo+email → timestamp

// Limiti per tipo di email (in millisecondi)
const LIMITS = {
  transazionale: 0,                       // sempre permessa
  marketing: 1000 * 60 * 60 * 24 * 7,     // 1 a settimana
  proposte: 1000 * 60 * 60 * 24 * 7,      // 1 a settimana
  novita: 1000 * 60 * 60 * 24 * 7,        // 1 a settimana
  report: 1000 * 60 * 60 * 24,            // 1 al giorno
  segmentazione: 1000 * 60 * 60 * 24      // 1 al giorno
};

function debug(msg, data = null) {
  console.log(`[EMAIL-FIREWALL] ${msg}`, data ? data : "");
}

/**
 * =========================================================
 * emailFirewall()
 * Decide SE un'email può essere inviata
 * NON invia email — solo autorizza o blocca
 * =========================================================
 */
async function emailFirewall({ email, tipo, subject, html }) {
  try {
    // 1) Contenuto obbligatorio
    if (!html || html.trim().length < 20) {
      console.error("[EMAIL-FIREWALL] BLOCCATA: contenuto vuoto");
      return "BLOCKED";
    }

    // 2) Chiave univoca (tipo + email)
    const key = `${tipo}:${email}`;
    const now = Date.now();
    const last = lastSend.get(key);
    const limit = LIMITS[tipo] ?? 0;

    // 3) Rate limit
    if (last && now - last < limit) {
      debug("BLOCCATA: rate limit attivo", { tipo, email });
      return "BLOCKED";
    }

    // 4) Aggiorna timestamp
    lastSend.set(key, now);

    debug("PERMESSA", { tipo, email, subject });
    return "ALLOW";

  } catch (err) {
    console.error("[EMAIL-FIREWALL] Errore:", err);
    return "BLOCKED";
  }
}

module.exports = { emailFirewall };
