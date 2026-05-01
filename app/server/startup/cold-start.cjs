/**
 * =========================================================
 * COLD-START — Versione 2027.1 SAFE MODE
 * Warmup ottimizzato e sicuro per Render:
 * - Precarica solo DB
 * - Precarica router universale UNA sola volta
 * - Evita moduli lenti (YouTube)
 * - Evita fetch interni
 * - Evita loop e OOM
 * =========================================================
 */

const path = require("path");

module.exports = async function coldStart(app) {
  console.log("\n====================================");
  console.log("❄️  COLD START — SAFE MODE");
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
       2) WARMUP ROUTER UNIVERSALE (UNA sola volta)
    ========================================================== */
    console.log("🛣️  Warmup router universale…");
    try {
      require(path.join(process.cwd(), "app/server/index.cjs"));
      require(path.join(process.cwd(), "app/server/router.cjs"));
      console.log("   ✅ Router universale precaricato");
    } catch (err) {
      console.error("   ❌ Errore warmup router:", err.message);
    }

    /* =========================================================
       3) MODULI LENTI DISATTIVATI
       (YouTube, logging esterno, ecc.)
    ========================================================== */
    console.log("🟧 Moduli lenti disattivati in SAFE MODE");

    /* =========================================================
       4) NESSUN FETCH INTERNO
       (evita loop e OOM)
    ========================================================== */
    console.log("🟧 Ping interno disattivato (SAFE MODE)");

    /* =========================================================
       COMPLETATO
    ========================================================== */
    console.log("====================================");
    console.log("❄️  COLD START COMPLETATO (SAFE MODE)");
    console.log("====================================\n");

  } catch (err) {
    console.error("❌ ERRORE COLD START:", err);
  }
};
