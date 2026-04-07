// =====================================================
// FILE: app/modules/automazioni/engine.cjs
// SCOPO: Motore centrale automazioni (future-proof)
// =====================================================

const path = require("path");

// DB — percorso assoluto corretto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// Moduli automazioni
const { segmentazione } = require(path.join(process.cwd(), "app/modules/automazioni/segmentazione.cjs"));
const { 
  reportGiornaliero, 
  reportSettimanale, 
  reportMensile 
} = require(path.join(process.cwd(), "app/modules/automazioni/reportistica.cjs"));

// Debug globale
function debug(msg, data = null) {
  console.log(`[ENGINE] ${msg}`, data ? data : "");
}

// =========================
// 1) JOB MANUALI (safe)
// =========================

function jobSegmentazione() {
  try {
    debug("Esecuzione segmentazione...");
    const utenti = db.prepare("SELECT * FROM utenti").all();
    utenti.forEach(u => segmentazione(u));
  } catch (err) {
    console.error("[ENGINE] Errore segmentazione:", err);
  }
}

function jobReportGiornaliero() {
  try {
    debug("Esecuzione report giornaliero...");
    reportGiornaliero();
  } catch (err) {
    console.error("[ENGINE] Errore report giornaliero:", err);
  }
}

function jobReportSettimanale() {
  try {
    debug("Esecuzione report settimanale...");
    reportSettimanale();
  } catch (err) {
    console.error("[ENGINE] Errore report settimanale:", err);
  }
}

function jobReportMensile() {
  try {
    debug("Esecuzione report mensile...");
    reportMensile();
  } catch (err) {
    console.error("[ENGINE] Errore report mensile:", err);
  }
}

// =========================
// 2) TRIGGER EVENTI
// =========================

function onNuovoOrdine(ordine) {
  debug("Trigger: nuovo ordine", ordine.id);
}

function onNuovoFeedback(feedback) {
  debug("Trigger: nuovo feedback", feedback.id);
}

function onNuovoUtente(utente) {
  debug("Trigger: nuovo utente", utente.email);
  segmentazione(utente);
}

// =========================
// EXPORT
// =========================

module.exports = {
  jobSegmentazione,
  jobReportGiornaliero,
  jobReportSettimanale,
  jobReportMensile,
  onNuovoOrdine,
  onNuovoFeedback,
  onNuovoUtente
};
