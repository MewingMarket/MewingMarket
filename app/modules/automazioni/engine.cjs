// =====================================================
// FILE: app/modules/automazioni/engine.cjs
// SCOPO: Motore centrale automazioni (future-proof)
// =====================================================

const path = require("path");
const db = require("../../db/database.cjs");

// Moduli automazioni
const { segmentazione } = require("./segmentazione.cjs");
const { 
  reportGiornaliero, 
  reportSettimanale, 
  reportMensile 
} = require("./reportistica.cjs");

// Debug globale
function debug(msg, data = null) {
  console.log(`[ENGINE] ${msg}`, data ? data : "");
}

// =========================
// 1) SCHEDULER
// =========================

// Segmentazione ogni 30 minuti
setInterval(() => {
  try {
    debug("Esecuzione segmentazione...");
    const utenti = db.prepare("SELECT * FROM utenti").all();
    utenti.forEach(u => segmentazione(u));
  } catch (err) {
    console.error("[ENGINE] Errore segmentazione:", err);
  }
}, 30 * 60 * 1000);

// Report giornaliero
setInterval(() => {
  try {
    debug("Esecuzione report giornaliero...");
    reportGiornaliero();
  } catch (err) {
    console.error("[ENGINE] Errore report giornaliero:", err);
  }
}, 24 * 60 * 60 * 1000);

// Report settimanale
setInterval(() => {
  try {
    debug("Esecuzione report settimanale...");
    reportSettimanale();
  } catch (err) {
    console.error("[ENGINE] Errore report settimanale:", err);
  }
}, 7 * 24 * 60 * 60 * 1000);

// Report mensile
setInterval(() => {
  try {
    debug("Esecuzione report mensile...");
    reportMensile();
  } catch (err) {
    console.error("[ENGINE] Errore report mensile:", err);
  }
}, 30 * 24 * 60 * 60 * 1000);


// =========================
// 2) TRIGGER EVENTI
// =========================

function onNuovoOrdine(ordine) {
  debug("Trigger: nuovo ordine", ordine.id);
  // In futuro: patch email-acquisto
}

function onNuovoFeedback(feedback) {
  debug("Trigger: nuovo feedback", feedback.id);
  // In futuro: email ringraziamento + KPI
}

function onNuovoUtente(utente) {
  debug("Trigger: nuovo utente", utente.email);
  segmentazione(utente);
}


// =========================
// EXPORT
// =========================

module.exports = {
  onNuovoOrdine,
  onNuovoFeedback,
  onNuovoUtente
};
