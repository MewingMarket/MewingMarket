// =====================================================
// FILE: app/modules/automazioni/reportistica.cjs
// SCOPO: SOLO report mensile (giornaliero/settimanale disattivati)
// FUTURE-PROOF + DEBUG
// =====================================================

const path = require("path");

// DB — percorso assoluto corretto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// Email automatiche — percorso assoluto corretto
const { inviaEmailAutomatica } = require(
  path.join(process.cwd(), "app/modules/email-automatiche.cjs")
);

const DESTINATARIO = "mewingmarket2@gmail.com";

function debug(msg, data = null) {
  console.log(`[REPORT] ${msg}`, data ? data : "");
}

// =========================
// REPORT MENSILE (UNICO ATTIVO)
// =========================

async function reportMensile() {
  try {
    debug("Generazione report mensile...");

    const kpi = db.prepare(`
      SELECT * FROM kpi_mensili ORDER BY mese DESC LIMIT 1
    `).get();

    // Nessun dato → non inviare nulla
    if (!kpi) {
      debug("Nessun dato disponibile per report_mensile");
      return;
    }

    // Dati vuoti → non inviare nulla
    if (Object.keys(kpi).length === 0) {
      debug("Report mensile vuoto, nessuna email inviata");
      return;
    }

    // Invia SOLO se ci sono dati reali
    await inviaEmailAutomatica({
      to: DESTINATARIO,
      template: "report_mensile",
      dati: kpi
      // 🔥 tipo: "report" viene già aggiunto automaticamente
    });

    debug("Report mensile inviato correttamente");

  } catch (err) {
    console.error("[REPORT] Errore mensile:", err);
  }
}

// =========================
// EXPORT — SOLO MENSILE
// =========================

module.exports = {
  reportMensile
};
