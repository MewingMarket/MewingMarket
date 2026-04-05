// =====================================================
// FILE: app/modules/automazioni/reportistica.cjs
// SCOPO: Report giornalieri/settimanali/mensili
// DESTINATARIO: mewingmarket2@gmail.com
// FUTURE-PROOF + DEBUG
// =====================================================

const db = require("../../db/database.cjs");
const { inviaEmailAutomatica } = require("../email-automatiche.cjs");

const DESTINATARIO = "mewingmarket2@gmail.com";

function debug(msg, data = null) {
  console.log(`[REPORT] ${msg}`, data ? data : "");
}

// =========================
// REPORT GIORNALIERO
// =========================

async function reportGiornaliero() {
  try {
    debug("Generazione report giornaliero...");

    const kpi = db.prepare(`
      SELECT * FROM kpi_giornalieri ORDER BY data DESC LIMIT 1
    `).get();

    await inviaEmailAutomatica({
      to: DESTINATARIO,
      template: "report_giornaliero",
      dati: kpi
    });

  } catch (err) {
    console.error("[REPORT] Errore giornaliero:", err);
  }
}

// =========================
// REPORT SETTIMANALE
// =========================

async function reportSettimanale() {
  try {
    debug("Generazione report settimanale...");

    const kpi = db.prepare(`
      SELECT * FROM kpi_settimanali ORDER BY settimana DESC LIMIT 1
    `).get();

    await inviaEmailAutomatica({
      to: DESTINATARIO,
      template: "report_settimanale",
      dati: kpi
    });

  } catch (err) {
    console.error("[REPORT] Errore settimanale:", err);
  }
}

// =========================
// REPORT MENSILE
// =========================

async function reportMensile() {
  try {
    debug("Generazione report mensile...");

    const kpi = db.prepare(`
      SELECT * FROM kpi_mensili ORDER BY mese DESC LIMIT 1
    `).get();

    await inviaEmailAutomatica({
      to: DESTINATARIO,
      template: "report_mensile",
      dati: kpi
    });

  } catch (err) {
    console.error("[REPORT] Errore mensile:", err);
  }
}

module.exports = {
  reportGiornaliero,
  reportSettimanale,
  reportMensile
};
