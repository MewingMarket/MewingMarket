/**
 * =========================================================
 * COLD-START — Versione 2027.2 SAFE MODE (NO OOM)
 * - Precarica solo DB
 * - NON carica router
 * - NON carica index
 * - NON carica moduli pesanti
 * - Nessun fetch interno
 * =========================================================
 */

const path = require("path");

module.exports = async function coldStart(app) {
  console.log("\n====================================");
  console.log("❄️  COLD START — SAFE MODE 2027.2");
  console.log("====================================");

  try {
    /* =========================================================
       1) WARMUP DB (sicuro)
    ========================================================== */
    console.log("🗄️  Warmup DB…");
    try {
      const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
      db.prepare("SELECT 1").get();
      console.log("   ✅ DB pronto");
    } catch (err) {
      console.error("   ❌ Errore warmup DB:", err.message);
    }

    /* =========================================================
       2) ROUTER / INDEX DISATTIVATI (evita OOM)
    ========================================================== */
    console.log("🟧 Router e index NON precaricati (SAFE MODE)");

    /* =========================================================
       3) MODULI LENTI DISATTIVATI
    ========================================================== */
    console.log("🟧 Moduli lenti disattivati (YouTube, logging esterno)");

    /* =========================================================
       4) NESSUN FETCH INTERNO
    ========================================================== */
    console.log("🟧 Ping interno disattivato (SAFE MODE)");

    /* =========================================================
       COMPLETATO
    ========================================================== */
    console.log("====================================");
    console.log("❄️  COLD START COMPLETATO (SAFE MODE 2027.2)");
    console.log("====================================\n");

  } catch (err) {
    console.error("❌ ERRORE COLD START:", err);
  }
};
