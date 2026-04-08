// =====================================================
// FILE: app/modules/automazioni/orchestratore.cjs
// SCOPO: Avviare i job del motore automazioni (SAFE MODE)
// =====================================================

const path = require("path");

// Require assoluto blindato
const engine = require(path.join(process.cwd(), "app/modules/automazioni/engine.cjs"));

console.log("🔥 ORCHESTRATORE AUTOMAZIONI AVVIATO (SAFE MODE)");

// =====================================================
// PATCH ANTI-OVERLAP 2026
// Evita che due intervalli si sovrappongano se Node è sotto carico
// =====================================================
let lockSegmentazione = false;
let lockReportMensile = false;

// ===============================
// 1) SEGMENTAZIONE — SAFE
// ===============================

setInterval(() => {
  if (lockSegmentazione) {
    return console.log("[ORCH] Segmentazione ignorata (overlap)");
  }

  lockSegmentazione = true;

  try {
    engine.jobSegmentazione();
  } catch (err) {
    console.error("[ORCH] Errore jobSegmentazione:", err);
  } finally {
    lockSegmentazione = false;
  }
}, 30 * 60 * 1000);

// ===============================
// 2) REPORT — SOLO MENSILE
// ===============================

// Report mensile (ogni 30 giorni)
setInterval(() => {
  if (lockReportMensile) {
    return console.log("[ORCH] Report mensile ignorato (overlap)");
  }

  lockReportMensile = true;

  try {
    engine.jobReportMensile();
  } catch (err) {
    console.error("[ORCH] Errore jobReportMensile:", err);
  } finally {
    lockReportMensile = false;
  }
}, 30 * 24 * 60 * 60 * 1000);

// ===============================
// 3) AVVIO IMMEDIATO (SAFE)
// ===============================

try {
  engine.jobSegmentazione();
} catch (err) {
  console.error("[ORCH] Errore avvio immediato segmentazione:", err);
}
