// =====================================================
// FILE: app/modules/automazioni/orchestratore.cjs
// SCOPO: Avviare i job del motore automazioni (SAFE MODE)
// =====================================================

const path = require("path");

// Require assoluto blindato
const engine = require(path.join(process.cwd(), "app/modules/automazioni/engine.cjs"));

console.log("🔥 ORCHESTRATORE AUTOMAZIONI AVVIATO (SAFE MODE)");

// ===============================
// 1) SEGMENTAZIONE — SAFE
// ===============================

// Segmentazione ogni 30 minuti (ma con anti-loop interno)
setInterval(() => {
  try {
    engine.jobSegmentazione();
  } catch (err) {
    console.error("[ORCH] Errore jobSegmentazione:", err);
  }
}, 30 * 60 * 1000);

// ===============================
// 2) REPORT — SOLO MENSILE
// ===============================

// Disattivati giornaliero e settimanale
// setInterval(engine.jobReportGiornaliero, ...);
// setInterval(engine.jobReportSettimanale, ...);

// Report mensile (ogni 30 giorni)
setInterval(() => {
  try {
    engine.jobReportMensile();
  } catch (err) {
    console.error("[ORCH] Errore jobReportMensile:", err);
  }
}, 30 * 24 * 60 * 60 * 1000);

// ===============================
// 3) AVVIO IMMEDIATO (SAFE)
// ===============================

// Segmentazione immediata ma con anti-loop interno
try {
  engine.jobSegmentazione();
} catch (err) {
  console.error("[ORCH] Errore avvio immediato segmentazione:", err);
}
