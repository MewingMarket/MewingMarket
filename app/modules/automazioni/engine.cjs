/* FILE: app/modules/automazioni/engine.cjs */
// =====================================================
// FILE: app/modules/automazioni/engine.cjs
// SCOPO: Motore centrale automazioni (future-proof)
// =====================================================

const path = require("path");

// 🔥 FIREWALL ENGINE (SOFT) — evita re-init nello stesso processo
if (global.__engine_initialized) {
  console.log("[ENGINE] Già inizializzato in questo processo");
} else {
  global.__engine_initialized = true;
  console.log("[ENGINE] Inizializzazione motore automazioni");
}

// DB — percorso assoluto corretto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// Moduli automazioni
const { segmentazione } = require(path.join(process.cwd(), "app/modules/automazioni/segmentazione.cjs"));
const { reportMensile } = require(path.join(process.cwd(), "app/modules/automazioni/reportistica.cjs"));

// Debug globale
function debug(msg, data = null) {
  console.log(`[ENGINE] ${msg}`, data ? data : "");
}

// =====================================================
// PATCH ANTI-LOOP 2026
// Evita doppie esecuzioni in caso di restart o doppio trigger
// =====================================================
const locks = {
  segmentazione: false,
  reportMensile: false
};

// =========================
// 1) JOB MANUALI (safe)
// =========================

function jobSegmentazione() {
  if (locks.segmentazione) {
    return debug("Segmentazione ignorata (lock attivo)");
  }

  locks.segmentazione = true;

  try {
    debug("Esecuzione segmentazione...");
    const utenti = db.prepare("SELECT * FROM utenti").all();
    utenti.forEach(u => segmentazione(u));
  } catch (err) {
    console.error("[ENGINE] Errore segmentazione:", err);
  } finally {
    locks.segmentazione = false;
  }
}

// ⚠️ DISATTIVATI: giornaliero e settimanale
function jobReportGiornaliero() {
  debug("Report giornaliero DISATTIVATO");
}

function jobReportSettimanale() {
  debug("Report settimanale DISATTIVATO");
}

// ✔️ UNICO REPORT ATTIVO
function jobReportMensile() {
  if (locks.reportMensile) {
    return debug("Report mensile ignorato (lock attivo)");
  }

  locks.reportMensile = true;

  try {
    debug("Esecuzione report mensile...");
    reportMensile();
  } catch (err) {
    console.error("[ENGINE] Errore report mensile:", err);
  } finally {
    locks.reportMensile = false;
  }
}

// =========================
// 2) TRIGGER EVENTI
// =========================

function onNuovoOrdine(ordine) {
  debug("Trigger: nuovo ordine", ordine?.id);
  // Le email partono dai moduli dedicati (corretto)
}

function onNuovoFeedback(feedback) {
  debug("Trigger: nuovo feedback", feedback?.id);
  // Le email partono dai moduli dedicati (corretto)
}

function onNuovoUtente(utente) {
  debug("Trigger: nuovo utente", utente?.email);
  segmentazione(utente); // firewall protegge le email
}

// =========================
// EXPORT
// =========================

module.exports = {
  jobSegmentazione,
  jobReportMensile,   // ← unico attivo
  onNuovoOrdine,
  onNuovoFeedback,
  onNuovoUtente
};
