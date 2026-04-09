/* FILE: app/modules/automazioni/reportistica.cjs */
// =====================================================
// FILE: app/modules/automazioni/reportistica.cjs
// SCOPO: SOLO report mensile (giornaliero/settimanale disattivati)
// FUTURE-PROOF + DEBUG
// + PATCH 2026: Flag persistente "report_mensile"
// + PATCH 2026-B: Backup automatico report (modulo unico)
// =====================================================

const path = require("path");

// DB — percorso assoluto corretto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

// Email automatiche — percorso assoluto corretto
const { inviaEmailAutomatica } = require(
  path.join(process.cwd(), "app/modules/email-automatiche.cjs")
);

// 🔥 Modulo unico backup
const { backup } = require(
  path.join(process.cwd(), "app/server/modules/backup.cjs")
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

    // 🔥 FIREWALL PERSISTENTE: se abbiamo già inviato questo mese, skip
    const riferimento = kpi.mese || kpi.id || "ultimo";
    if (db.hasFlag("report_mensile", riferimento)) {
      debug("Report mensile già inviato per riferimento:", riferimento);
      return;
    }

    // ============================
    // 1) INVIO EMAIL AUTOMATICA
    // ============================
    await inviaEmailAutomatica({
      to: DESTINATARIO,
      template: "report_mensile",
      dati: kpi
      // tipo: "report" viene già aggiunto automaticamente
    });

    // ============================
    // 2) BACKUP REPORT (modulo unico)
    // ============================
    try {
      await backup("report", { kpi });
      debug("Backup report mensile completato");
    } catch (err) {
      console.error("❌ Errore backup report mensile:", err);
    }

    // ============================
    // 3) REGISTRA FLAG
    // ============================
    try {
      db.setFlag("report_mensile", riferimento);
    } catch (err) {
      console.error("❌ Errore setFlag report_mensile:", err);
    }

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
