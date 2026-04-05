// =====================================================
// FILE: app/modules/automazioni/orchestratore.cjs
// SCOPO: Avviare i job del motore automazioni
// =====================================================

const engine = require("./engine.cjs");

console.log("🔥 ORCHESTRATORE AUTOMAZIONI AVVIATO");

// Segmentazione ogni 30 minuti
setInterval(engine.jobSegmentazione, 30 * 60 * 1000);

// Report giornaliero
setInterval(engine.jobReportGiornaliero, 24 * 60 * 60 * 1000);

// Report settimanale
setInterval(engine.jobReportSettimanale, 7 * 24 * 60 * 60 * 1000);

// Report mensile
setInterval(engine.jobReportMensile, 30 * 24 * 60 * 60 * 1000);

// Esecuzione immediata all’avvio (opzionale)
engine.jobSegmentazione();
