/* FILE: app/modules/automazioni/orchestratore.cjs */
// =====================================================
// ORCHESTRATORE AUTOMAZIONI — VERSIONE PATCHATA 2026
// Report mensile eseguito SOLO una volta al mese
// =====================================================

const path = require("path");

// FIREWALL ORCHESTRATORE
if (global.__orchestratore_started) {
  console.log("⚠️ ORCHESTRATORE GIÀ ATTIVO — skip");
  return;
}
global.__orchestratore_started = true;

const engine = require(path.join(process.cwd(), "app/modules/automazioni/engine.cjs"));
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

console.log("🔥 ORCHESTRATORE AUTOMAZIONI AVVIATO (SAFE MODE)");

// =====================================================
// PATCH ANTI-OVERLAP
// =====================================================
let lockSegmentazione = false;
let lockReportMensile = false;

// =====================================================
// 1) SEGMENTAZIONE — ogni 30 minuti
// =====================================================
setInterval(() => {
  if (lockSegmentazione) return;

  lockSegmentazione = true;
  try {
    engine.jobSegmentazione();
  } catch (err) {
    console.error("[ORCH] Errore jobSegmentazione:", err);
  } finally {
    lockSegmentazione = false;
  }
}, 30 * 60 * 1000);

// =====================================================
// 2) REPORT MENSILE — PATCH: controlla la data
// =====================================================

function shouldRunMonthlyReport() {
  const now = new Date();
  const meseCorrente = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Se già inviato → STOP
  if (db.hasFlag("report_mensile", meseCorrente)) {
    return false;
  }

  // Esegui SOLO il giorno 9 di ogni mese
  return now.getDate() === 9;
}

// Controllo giornaliero (ogni 24 ore)
setInterval(() => {
  if (lockReportMensile) return;
  lockReportMensile = true;

  try {
    if (shouldRunMonthlyReport()) {
      console.log("📅 Avvio report mensile…");
      engine.jobReportMensile();
    }
  } catch (err) {
    console.error("[ORCH] Errore jobReportMensile:", err);
  } finally {
    lockReportMensile = false;
  }
}, 24 * 60 * 60 * 1000);

// =====================================================
// 3) AVVIO IMMEDIATO SEGMENTAZIONE
// =====================================================
try {
  engine.jobSegmentazione();
} catch (err) {
  console.error("[ORCH] Errore avvio immediato segmentazione:", err);
}
